/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude benchmark and test directories from build to prevent stack overflow
  // These directories contain many files that can cause micromatch issues
  webpack: (config, { isServer }) => {
    // Exclude directories from webpack processing to prevent stack overflow
    // Ensure ignored is always an array of non-empty strings
    const existingIgnored = config.watchOptions?.ignored
    let ignoredArray = []
    
    if (Array.isArray(existingIgnored)) {
      // Filter out empty strings and ensure all are strings
      ignoredArray = existingIgnored.filter(item => typeof item === 'string' && item.trim().length > 0)
    } else if (typeof existingIgnored === 'string' && existingIgnored.trim().length > 0) {
      // Convert single string to array
      ignoredArray = [existingIgnored]
    }
    
    // Add our exclusions (all non-empty strings)
    // Exclude build outputs, test directories, and node_modules to prevent recursion
    const additionalIgnored = [
      '**/node_modules/**',
      '**/.next/**',
      '**/benchmark/**',
      '**/test-images/**',
      '**/ocr/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
    ]
    
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [...ignoredArray, ...additionalIgnored],
    }

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
    // Consolidate alias assignment to avoid duplication
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
    
    // Add resolver to handle the relative import
    const path = require('path')
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, 'node_modules/@supabase/supabase-js/dist'),
    ]
    
    // Ensure @ alias resolves correctly (for Vercel build environment)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    }
    
    return config
  },
  transpilePackages: ['@supabase/ssr'],
}

module.exports = nextConfig

