/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev build output off iCloud/OneDrive to avoid corrupt/stale _next/static chunks.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["ws"],
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "dua-prayer.vercel.app" }],
        destination: "https://www.duaprayer.com/:path*",
        permanent: true,
      },
      {
        // Legacy singular channel route consolidated into /channels/<handle>.
        source: "/channel/:handle",
        destination: "/channels/:handle",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ]
  },
  // iCloud/OneDrive paths fire duplicate file events; polling avoids spurious full restarts.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        // iCloud/OneDrive fire rapid duplicate events; slow polling + debounce avoids recompile death spirals.
        poll: 2000,
        aggregateTimeout: 2000,
        // Do not watch dist output or pid/log files — prevents restart loops when supervisor writes metadata.
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.DS_Store",
          "**/._*",
          "**/*.icloud",
          "**/.dev-server.pid",
          "**/.dev-server.lock",
          "**/.next/**",
          "/tmp/dua-prayer-next/**",
        ],
      }
    }
    return config
  },
}

export default nextConfig
