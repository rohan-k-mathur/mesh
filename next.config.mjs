import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      use: ["raw-loader", "glslify", "glslify-loader"],
    });

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      yjs: path.resolve(__dirname, "node_modules/yjs"),
      "@tldraw/utils": path.resolve(__dirname, "node_modules/@tldraw/utils"),
      "@tldraw/state": path.resolve(__dirname, "node_modules/@tldraw/state"),
      "@tldraw/state-react": path.resolve(
        __dirname,
        "node_modules/@tldraw/state-react"
      ),
      "@tldraw/store": path.resolve(__dirname, "node_modules/@tldraw/store"),
      "@tldraw/validate": path.resolve(
        __dirname,
        "node_modules/@tldraw/validate"
      ),
      "@tldraw/tlschema": path.resolve(
        __dirname,
        "node_modules/@tldraw/tlschema"
      ),
      "@tldraw/editor": path.resolve(__dirname, "node_modules/@tldraw/editor"),
      tldraw: path.resolve(__dirname, "node_modules/tldraw"),
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["@tldraw/tldraw"],
  },
    images: {

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
          protocol: 'https',
          hostname: '**.supabase.co',
          pathname: '/storage/v1/object/public/**',
        },
        { protocol: 'https', hostname: '**.supabase.co', pathname: '/storage/**' },
        {
          protocol: "https",
          hostname: "*.blob.core.windows.net"
        }
      ],
    },
    transpilePackages: ['@app/sheaf-acl'], 
  typescript: {
    ignoreBuildErrors: true,
  },
  };
  

export default nextConfig;
