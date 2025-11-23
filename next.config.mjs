/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Proxy API requests to backend to avoid CORS issues
  async rewrites() {
    // Get backend URL, removing /api suffix if present
    // Use API_URL (server-side) or NEXT_PUBLIC_API_URL (client-accessible)
    let backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
    
    // Only set up rewrite if backend URL is configured
    if (!backendUrl) {
      console.warn('Warning: API_URL or NEXT_PUBLIC_API_URL not set. API proxy will not work.');
      return [];
    }
    
    // Remove trailing /api if it exists
    backendUrl = backendUrl.replace(/\/api\/?$/, '');
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
