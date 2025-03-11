/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  // Disable static generation for all pages
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  // Add support for static file serving
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig