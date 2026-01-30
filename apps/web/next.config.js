/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@incheon-dashboard/shared', '@incheon-dashboard/api'],
};

module.exports = nextConfig;
