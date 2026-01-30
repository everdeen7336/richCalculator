const path = require('path');

// Load root .env file so shared package env vars are available in Next.js server
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@incheon-dashboard/shared', '@incheon-dashboard/api'],
};

module.exports = nextConfig;
