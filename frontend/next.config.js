/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**.onrender.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.s3.**.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  eslint: {
    // Ignore ESLint during builds (optional - uncomment if you want to skip ESLint)
    // ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is enabled - fix all type errors
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, '.'),
    };
    return config;
  },
};

module.exports = nextConfig;

