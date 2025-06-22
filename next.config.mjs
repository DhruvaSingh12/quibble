/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
      staleTimes: {
        dynamic: 30,
      },
    },
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals = [
          ...config.externals,
          "@node-rs/argon2",
        ];
      }
      return config;
    },
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "utfs.io",
          pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`
        },
      ],
    },
  };
  
  export default nextConfig;