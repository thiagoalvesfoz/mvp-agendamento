/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  experimental: {
    typedRoutes: true,
    serverActions: {
      // Acomoda upload da capa da landing (até 5 MB no input + overhead multipart).
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: [
      // Adicione domínios externos aqui quando necessário
    ],
  },
};

export default nextConfig;
