/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep builds deterministic in CI/dev.
  poweredByHeader: false
};

module.exports = nextConfig;

