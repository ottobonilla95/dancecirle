const withNextIntl = require('next-intl/plugin')('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return [
      // Rewrite short URLs to username page
      {
        source: '/:username([a-zA-Z0-9]+)',
        destination: '/:username',
        has: [
          {
            type: 'host',
            value: 'dancecircle.co'
          }
        ]
      }
    ];
  },
};

module.exports = withNextIntl(nextConfig);
