/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // El id de compilación se expone al navegador para poder avisar de que hay
  // una versión nueva publicada. Ver /api/version.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.RAILWAY_GIT_COMMIT_SHA
      || String(Date.now()),
  },
  poweredByHeader: false,
  output: 'standalone',
  // Cabeceras de seguridad para todo el sitio: el panel de admin muestra
  // datos sensibles (IBAN de farmacias), así que evitamos que se pueda
  // incrustar en un iframe (clickjacking), forzamos HTTPS y bloqueamos el
  // sniffing de tipos MIME. No se añade CSP para no romper estilos/scripts.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
    ];
  },
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
