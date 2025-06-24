/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify", "glslify-loader"],
    });
    return config;
  },
    images: {
      domains: ['localhost'], 

      remotePatterns: [
        {
          protocol: "https",
          hostname: "uploadthing.com",
        },
        {
          protocol: "https",
          hostname: "utfs.io",
        },
        {
          protocol: "https",
          hostname: "placehold.co",
        },
        {
          protocol: "https",
          hostname: "i.imgur.com",
        },
        {
          protocol: "https",
          hostname: "live.staticflickr.com",
        },
        {
          protocol: "https",
          hostname: "media2.giphy.com"
        },
        {
          protocol: "https",
          hostname: "*.supabase.co",
        },
        {
          protocol: "https",
          hostname: "i.redd.it"
        },
        {
          protocol: "https",
          hostname: "*.blob.core.windows.net"
        }
      ],
    },
  };

export default nextConfig;
