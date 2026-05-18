const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.weserv.nl",
      },
    ],
  },
};

export default nextConfig;
