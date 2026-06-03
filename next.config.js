/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  
  // Security headers are handled in netlify.toml
  poweredByHeader: false,
  
  // React optimizations
  reactStrictMode: true,
  
  // Image optimization
  images: {
    unoptimized: process.env.NODE_ENV === 'production',
    // Add any image domains if needed
  },
  
  // Environment variables
  env: {
    // no Supabase environment variables required
  }
}

module.exports = nextConfig

