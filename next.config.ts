import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), display-capture=(self)'
          },
          {
            key: 'Feature-Policy',
            value: 'camera \'self\'; microphone \'self\''
          },
        ],
      },
    ];
  },
};

export default nextConfig;
