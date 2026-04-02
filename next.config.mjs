/** @type {import('next').NextConfig} */

const NEXT_PUBLIC_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const API_DESTINATION_URL = process.env.API_DESTINATION_URL ?? "";

const apiIsFullUrl = /^https?:\/\//.test(NEXT_PUBLIC_API_BASE_URL);
const destinationIsFullUrl = /^https?:\/\//.test(API_DESTINATION_URL);

// In direct mode, use NEXT_PUBLIC_API_BASE_URL as origin.
// In proxy mode, use API_DESTINATION_URL as the rewrite destination.
const apiOrigin = apiIsFullUrl
  ? new URL(NEXT_PUBLIC_API_BASE_URL).origin
  : destinationIsFullUrl
    ? new URL(API_DESTINATION_URL).origin
    : "";

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },
  async rewrites() {
    // Forward /api/proxy/:path* to the real backend origin.
    // Required when NEXT_PUBLIC_API_BASE_URL=/api/proxy (proxy mode) to avoid
    // CORS failures from the browser calling the production API directly.
    if (!apiOrigin) return [];
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${apiOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
