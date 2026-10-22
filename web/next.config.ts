import type { NextConfig } from 'next';

// Фронт ходит в API по своему же origin (/api/v1/...), Next проксирует на бэкенд.
// Так нет CORS и доска открывается с телефона в локальной сети — телефону не нужен порт 3500.
const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3500';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
