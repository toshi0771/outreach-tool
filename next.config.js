/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [],
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'playwright', 'bull', 'ioredis']
    return config
  }
}
module.exports = nextConfig