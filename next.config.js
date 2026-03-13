/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverComponentsExternalPackages: ['playwright', 'bull', 'ioredis'] }
}
module.exports = nextConfig
