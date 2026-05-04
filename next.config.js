/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use async rewrites instead of middleware to avoid edge runtime issues
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
    };
  },
};

module.exports = nextConfig;
