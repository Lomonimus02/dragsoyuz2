import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/opengraph-image-12nfft", destination: "/opengraph-image", permanent: true }];
  },
  env: {
    NEXT_PUBLIC_LOCAL_PREVIEW: process.env.LOCAL_PREVIEW === "1" ? "1" : "0",
  },
  async headers() {
    if (process.env.LOCAL_PREVIEW !== "1") return [];
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            "connect-src 'self' ws://localhost:3000 ws://127.0.0.1:3000",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join("; "),
        },
      ],
    }];
  },
  // Отключаем встроенный 308-редирект Next.js по trailing slash.
  // Всеми редиректами (301) управляет наш middleware.
  skipTrailingSlashRedirect: true,
  turbopack: {
    root: process.cwd(),
  },
  output: "standalone",
  cacheMaxMemorySize: 0,
  experimental: { cpus: 1 },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
