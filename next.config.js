module.exports = {
  webpack: (config, { isServer }) => {
    // Reduce bundle size
    config.optimization.minimize = true;
    return config;
  }
}