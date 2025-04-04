// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // --- Your Custom Webpack Config (Keeping as is) ---
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      maxSize: 600000, // Keep chunks below 600KB
      cacheGroups: {
        three: {
          test: /[\\/]node_modules[\\/](three|@three)[\\/]/,
          name: 'three-vendors',
          priority: 10,
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react-vendors',
          priority: 20,
          reuseExistingChunk: true,
        },
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors-commons',
          priority: 1,
          reuseExistingChunk: true,
        }
      }
    };

    if (!isServer) {
      // Add bundle analyzer in development when needed
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            analyzerPort: 8888,
            openAnalyzer: true,
          })
        );
      }
    }
    // --- End of Your Custom Webpack Config ---

    return config;
  },

  // --- Standard Next.js Config Options ---
  compress: true, // Keep compression enabled
  poweredByHeader: false, // Keep poweredByHeader disabled
  reactStrictMode: true, // Keep Strict Mode enabled
  swcMinify: true, // Keep SWC minification enabled

  // --- Static Export Configuration ---
  // ** CHANGE: Use 'export' instead of 'standalone' for true static site generation **
  // This creates an 'out' folder suitable for static hosting like Cloudflare Pages.
  output: 'export',

  // ** ADD: Required for static export if using next/image **
  // Tells Next.js not to try and use its image optimization server,
  // as it won't be running on Cloudflare Pages by default.
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;