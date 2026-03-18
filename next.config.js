/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'playwright', 'bull', 'ioredis']
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'bull', 'ioredis']
  }
}
module.exports = nextConfig