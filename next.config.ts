/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // If your repo is username.github.io, leave basePath empty
  // If it's a project repo like username.github.io/portfolio, use:
  // basePath: '/portfolio',
  basePath: '',
  assetPrefix: '',
}

module.exports = nextConfig