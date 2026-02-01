const path = require('path');
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      // 일정/항공편 데이터 캐시 (API 응답)
      urlPattern: /^https?:\/\/.*\/api\/(flight|weather)/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 }, // 1시간
      },
    },
    {
      // 정적 자산 캐시
      urlPattern: /\.(js|css|woff2?|png|jpg|svg|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30일
      },
    },
    {
      // 지구본 텍스처 캐시
      urlPattern: /earth-texture\.jpg$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'globe-texture',
        expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 * 24 * 90 }, // 90일
      },
    },
  ],
});

// Load root .env file so shared package env vars are available in Next.js server
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@incheon-dashboard/shared', '@incheon-dashboard/api'],
};

module.exports = withPWA(nextConfig);
