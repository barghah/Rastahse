import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  // Turbopack resolve alias (Next.js 16 uses Turbopack by default)
  turbopack: {
    resolveAlias: {
      "@content": "./content",
    },
  },
};

export default nextConfig;
