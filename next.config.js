/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }
    
    // Fix for Supabase ESM module resolution - handle .mjs files
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    })
    
    // Fix the broken import path in wrapper.mjs
    const path = require('path')
    config.resolve.alias = {
      ...config.resolve.alias,
    }
    // Add resolver to handle the relative import
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, 'node_modules/@supabase/supabase-js/dist'),
    ]
    
    return config
  },
  transpilePackages: ['@supabase/ssr'],
  // Disable output file tracing to prevent micromatch recursion errors
  // Vercel handles dependencies automatically, so this is safe
  outputFileTracing: false,
  // Ensure NODE_ENV is set correctly in production
  env: {
    NODE_ENV: process.env.NODE_ENV || 'production',
  },
}

module.exports = nextConfig

