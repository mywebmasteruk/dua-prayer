/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev build output off iCloud/OneDrive to avoid corrupt/stale _next/static chunks.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["ws"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
