import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://duaprayer.com").replace(/\/$/, "")

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / authenticated surfaces that should never appear in search.
      disallow: ["/admin", "/account", "/bookmarks", "/notifications", "/auth", "/design-prototype"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
