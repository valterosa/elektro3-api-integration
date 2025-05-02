// Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the remix server
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ["**/.*"],
  serverModuleFormat: "esm", // Mantido ESM para compatibilidade com a versão atual do projeto
  serverPlatform: "node", // Adicionando configuração explícita de plataforma para evitar problemas com node:crypto
  appDirectory: "app",
  publicPath: "/build/",
  assetsBuildDirectory: "public/build",
  // Usamos o caminho compatível com a nova estrutura do Vite
  serverBuildPath: "build/server/index.js",
  // Configuração de porta de desenvolvimento
  dev: {
    port: process.env.HMR_SERVER_PORT || 8002,
  },
  // Adicionando novas flags recomendadas
  future: {
    v3_fetcherPersist: true,
    v3_lazyRouteDiscovery: true,
    v3_relativeSplatPath: true,
    v3_singleFetch: true,
    v3_throwAbortReason: true,
  },
  // Configuração importante para resolver o problema de importação JSON
  serverDependenciesToBundle: [
    /^(?!.*\b(node_modules)\b).*$/,
    /@shopify\/polaris.*/,
    /@shopify\/shopify-app-remix.*/,
  ],
};
