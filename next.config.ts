import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        /*
         * Assets de `public/` não levam hash no nome, então `immutable` não
         * serve — trocar uma foto de produto deixaria o visitante preso na
         * versão antiga. Um dia de cache com uma semana de
         * `stale-while-revalidate` dá o ganho de visita repetida sem travar
         * atualização de arte: o navegador serve o arquivo em cache na hora e
         * revalida em segundo plano.
         */
        source: "/:path*.(webp|mp4|svg|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
