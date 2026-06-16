import type { MetadataRoute } from "next"
import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { getChannelHandle } from "@/lib/channels"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://duaprayer.com").replace(/\/$/, "")

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/channels`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/channels/apply`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/donate`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/resources`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/safety`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/volunteer`, changeFrequency: "monthly", priority: 0.6 },
  ]

  const admin = createAdminSupabaseClient()
  const { data: categories } = await admin
    .from("categories")
    .select("id, name, handle, updated_at")
    .eq("is_active", true)
    .eq("status", "approved")

  const categoryEntries = (categories ?? []).map((category) => {
    const handle = getChannelHandle({ name: category.name, handle: category.handle })
    const lastModified = category.updated_at ? new Date(category.updated_at) : new Date()
    return { handle, lastModified }
  })

  const channelRoutes: MetadataRoute.Sitemap = categoryEntries.map(({ handle, lastModified }) => ({
    url: `${baseUrl}/channels/${handle}`,
    lastModified,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }))

  return [...staticRoutes, ...channelRoutes]
}
