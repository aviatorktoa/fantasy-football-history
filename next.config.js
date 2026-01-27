/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's.yimg.com',
      },
    ],
  },
};

module.exports = nextConfig;
