/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  // Improve build performance and handle auth during builds
  typescript: {
    // Don't fail builds on type errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development'
  },
  eslint: {
    // Don't fail builds on lint errors in development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development'
  },
  // Ensure Prisma works with Vercel - already included in serverExternalPackages above
}

module.exports = nextConfig