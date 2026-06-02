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
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

module.exports = nextConfig

