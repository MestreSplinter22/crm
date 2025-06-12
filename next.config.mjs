// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Adicione esta seção para resolver o aviso de cross-origin
  devIndicators: {
    allowedDevOrigins: ["https://dev-crm.xnwt97.easypanel.host"],
  },
}

export default nextConfig