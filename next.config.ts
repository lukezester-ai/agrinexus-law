import type { NextConfig } from "next";

const nextConfig: NextConfig = { 
  reactStrictMode: true,
  compress: true,
  experimental: {
    optimizeCss: true,
  }
};

export default nextConfig;
