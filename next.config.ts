import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/k/:code/bestel", destination: "/participant/:code/order" },
      { source: "/k/:code", destination: "/participant/:code" },
    ];
  },
};

export default nextConfig;
