/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Proxy API requests to backend to avoid CORS issues
  async rewrites() {
    // Get backend URL, removing /api suffix if present
    let backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
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
