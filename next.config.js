/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Optimize bundle size by implementing chunking strategy
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

    // Only include minimal set of three.js modules
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

    return config;
  },
  // Set output compression level
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Optimize output for static site
  output: 'standalone',
  // Add support for TypeScript path aliases if you use them
  swcMinify: true,
};

module.exports = nextConfig;