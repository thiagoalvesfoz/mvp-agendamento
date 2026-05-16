/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      // Adicione domínios externos aqui quando necessário
    ],
  },
};

export default nextConfig;
