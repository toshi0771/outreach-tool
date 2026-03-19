/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'bull', 'ioredis']
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    }
    return config
  },
}

module.exports = nextConfig
