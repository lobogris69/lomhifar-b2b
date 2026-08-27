/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // potrace (y jimp, que lleva dentro) no se pueden empaquetar: al hacerlo
    // sus clases se quedan por el camino y el vectorizado de los llaveros
    // revienta en producción con «Right-hand side of 'instanceof' is not
    // callable». Se cargan desde node_modules tal cual, en tiempo de
    // ejecución.
    serverComponentsExternalPackages: ['potrace', 'jimp'],
  },
};

export default nextConfig;
