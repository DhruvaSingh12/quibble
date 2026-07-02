/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.62.248.247", "192.168.1.16"],
  serverExternalPackages: ['@node-rs/argon2'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
      }
    ],
  },
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /(\.d\.cts$|README\.md$)/,
        contextRegExp: /@uploadthing/
      })
    );
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
      {
        source: '/api/uploadthing',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/uploadthing`,
      },
    ]
  },
};

export default nextConfig;