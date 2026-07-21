import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      // CDN — primary image storage
      {
        protocol: 'https',
        hostname: 'cdn.sanaathrumylens.co.ke',
      },
      // Main site + subdomains (for legacy images or inline content)
      {
        protocol: 'https',
        hostname: 'sanaathrumylens.co.ke',
      },
      {
        protocol: 'https',
        hostname: '*.sanaathrumylens.co.ke',
      },
      // Google user avatars
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      // localhost for dev
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true, // TODO: Fix pre-existing TS errors and remove this
  },
  reactStrictMode: true,
};

export default nextConfig;
