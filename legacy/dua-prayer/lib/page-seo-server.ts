import { unstable_cache } from "next/cache"
import type { Metadata } from "next"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { isMissingTableError } from "@/lib/db-errors"
import { getSeoSettings } from "@/lib/seo-settings-server"

// Public, indexable pages whose meta the admin can override. Home is excluded —
// the global SEO settings already own the home/root metadata. Channel pages have
// their own per-channel generateMetadata.
export type PageSeoSlug =
  | "about"
  | "channels"
  | "channels-apply"
  | "donate"
  | "resources"
  | "safety"
  | "volunteer"

export type PageSeoMeta = { slug: PageSeoSlug; label: string; path: string }

export const PAGE_SEO_PAGES: ReadonlyArray<PageSeoMeta> = [
  { slug: "about", label: "About", path: "/about" },
  { slug: "channels", label: "Channels", path: "/channels" },
  { slug: "channels-apply", label: "Channel application", path: "/channels/apply" },
  { slug: "donate", label: "Donate", path: "/donate" },
  { slug: "resources", label: "Resources", path: "/resources" },
  { slug: "safety", label: "Safety", path: "/safety" },
  { slug: "volunteer", label: "Volunteer", path: "/volunteer" },
]

export type PageSeoOverrides = {
  /** Page title (also og:title / twitter:title). Empty → falls back to global SEO. */
  title: string
  /** Meta description. Empty → falls back to global SEO description. */
  description: string
  /** og:image — absolute URL or root-relative path. Empty → global SEO image. */
  image: string
}

export const PAGE_SEO_EMPTY: PageSeoOverrides = { title: "", description: "", image: "" }

const PAGE_SEO_FIELDS = ["title", "description", "image"] as const

export function pageSeoKey(slug: PageSeoSlug, field: keyof PageSeoOverrides): string {
  return `seo.page.${slug}.${field}`
}

export const PAGE_SEO_CACHE_TAG = "site-setting-page-seo"

function emptyOverrideMap(): Record<PageSeoSlug, PageSeoOverrides> {
  return Object.fromEntries(PAGE_SEO_PAGES.map((p) => [p.slug, { ...PAGE_SEO_EMPTY }])) as Record<
    PageSeoSlug,
    PageSeoOverrides
  >
}

async function fetchAllOverrides(): Promise<Record<PageSeoSlug, PageSeoOverrides>> {
  const result = emptyOverrideMap()

  let supabase
  try {
    supabase = createAdminSupabaseClient()
  } catch (error) {
    console.error("Page SEO: missing Supabase credentials", error)
    return result
  }

  const keys = PAGE_SEO_PAGES.flatMap((p) => PAGE_SEO_FIELDS.map((f) => pageSeoKey(p.slug, f)))
  const { data, error } = await supabase.from("site_settings").select("key, value").in("key", keys)

  if (error) {
    if (!isMissingTableError(error)) console.error("Error fetching page SEO:", error)
    return result
  }

  for (const row of data ?? []) {
    const match = row.key.match(/^seo\.page\.(.+)\.(title|description|image)$/)
    if (!match) continue
    const slug = match[1] as PageSeoSlug
    const field = match[2] as keyof PageSeoOverrides
    if (result[slug]) result[slug][field] = ((row.value as string | null) ?? "").trim()
  }
  return result
}

const getAllOverridesCached = unstable_cache(fetchAllOverrides, [PAGE_SEO_CACHE_TAG], {
  revalidate: 300,
  tags: [PAGE_SEO_CACHE_TAG],
})

/**
 * Build Next.js Metadata for a static page: per-page DB overrides take
 * precedence, anything left blank falls back to the global SEO settings.
 */
export async function getPageSeo(slug: PageSeoSlug): Promise<Metadata> {
  const [all, global] = await Promise.all([getAllOverridesCached(), getSeoSettings()])
  const overrides = all[slug] ?? PAGE_SEO_EMPTY
  const page = PAGE_SEO_PAGES.find((p) => p.slug === slug)

  const title = overrides.title || global.title || undefined
  const description = overrides.description || global.description || undefined
  const image = overrides.image || global.image
  const siteName = global.siteName || undefined
  const canonical = page?.path

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      type: "website",
      siteName,
      title,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: siteName ?? "" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

/** Uncached read for the admin form — caller must enforce RBAC. */
export async function getAllPageSeoForAdmin(): Promise<Record<PageSeoSlug, PageSeoOverrides>> {
  return fetchAllOverrides()
}
