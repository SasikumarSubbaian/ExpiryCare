/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        canvas: false, // Canvas is server-side only
        'pdfjs-dist': false, // PDF.js is server-side only
      }
    } else {
      // Server-side: allow canvas and pdfjs-dist
      config.externals = config.externals || []
      // Don't externalize canvas or pdfjs-dist on server
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
}

module.exports = nextConfig

