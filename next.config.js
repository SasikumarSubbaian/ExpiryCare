/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        canvas: false, // Canvas is server-side only (optional)
        'pdfjs-dist': false, // PDF.js is server-side only (optional)
      }
    } else {
      // Server-side: externalize canvas and pdfjs-dist to prevent build errors
      // These are optional dependencies that may not be installed
      config.externals = config.externals || []
      config.externals.push({
        'canvas': 'commonjs canvas',
        'pdfjs-dist': 'commonjs pdfjs-dist',
      })
    }
    
    // Ignore these modules during build to prevent resolution errors
    config.resolve.alias = {
      ...config.resolve.alias,
      'canvas': false,
      'pdfjs-dist': false,
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

