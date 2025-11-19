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
        {
          protocol: "https",
          hostname: "utfs.io",
        },
        {
          protocol: "https",
          hostname: "**.ufs.sh",
        },
        {
          protocol: "https",
          hostname: "i.ytimg.com",
        },
        {
          protocol: "https",
          hostname: "**.youtube.com",
        },
        {
          protocol: "https",
          hostname: "**.vimeo.com",
        },
        {
          protocol: "https",
          hostname: "**.giphy.com",
        },
        {
          protocol: "https",
          hostname: "**.spotify.com",
        },
        {
          protocol: "https",
          hostname: "i.scdn.co",
        },
        {
          protocol: "https",
          hostname: "**.twimg.com",
        },
        {
          protocol: "https",
          hostname: "**.googleusercontent.com",
        },
        {
          protocol: "https",
          hostname: "images.unsplash.com",
        },
        {
          protocol: "https",
          hostname: "**.cdninstagram.com",
        }
      ],
    },
  };
  
  export default nextConfig;