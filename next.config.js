/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'playwright', 'bull', 'ioredis', 'googleapis', 'google-auth-library'
    ]
  }
}
module.exports = nextConfig