/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false
  },
  experimental: {
    optimizeCss: false
  },
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_BAZAAR_ENTER_API;
    if (api) return [];
    return [{ source: "/enter", destination: "http://localhost:4000/enter" }];
  }
};

module.exports = nextConfig;
