import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { installGlobals } from "@remix-run/node";
import { resolve } from "path";
import { vercelPreset } from "@vercel/remix/vite";

// Instalar globais do Remix para compatibilidade
installGlobals();

// https://vitejs.dev/config/
export default defineConfig({
  // Configurações básicas
  base: "/",

  // Configuração de resolução de módulos e aliases
  resolve: {
    // Garantir que arquivos ESM e CJS possam coexistir
    preserveSymlinks: true,

    // Configuração de aliases
    alias: {
      // Adicionar o alias '~' para apontar para a pasta app
      "~": resolve(__dirname, "app"),
    },
  },
  // Configurações de servidor de desenvolvimento
  server: {
    port: parseInt(process.env.PORT || "3000"),
    strictPort: false, // Permite que o Vite use outra porta se a principal estiver ocupada
    host: true, // Permite conexões externas
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      "protocol-point-cloud-contacting.trycloudflare.com",
      ".trycloudflare.com", // Permite qualquer subdomínio do cloudflare
      ".ngrok.io", // Para caso use ngrok também
    ],
    hmr: {
      // Configuração para evitar conflito de porta
      clientPort: "auto", // Usar detecção automática
      port: 24681, // Porta alternativa para evitar o conflito com 24680
      host: "localhost",
      protocol: "ws",
      overlay: true, // Mostrar overlay em caso de erros
    },
  },
  // Configurações específicas para build do servidor
  ssr: {
    noExternal: [
      // Pacotes que precisam ser incluídos no bundle do servidor
      "@shopify/shopify-app-remix",
      "@shopify/polaris",
      "@shopify/app-bridge-react",
      "@shopify/app-bridge",
      /^@shopify\/app-bridge.*$/,
      // Adicionar quaisquer outros que causem problemas
    ],
    target: "node",
    format: "esm",
  },

  // Configurações de build
  build: {
    rollupOptions: {
      external: [
        // Não externalizar app-bridge para o cliente
      ],
    },
  },
  // Configuração de otimização
  optimizeDeps: {
    // Forçar a inclusão de todos os módulos compatíveis
    include: [
      "react",
      "react-dom",
      "@shopify/polaris",
      "@shopify/app-bridge-react",
      "@shopify/app-bridge",
      "isbot",
    ],
  },

  // Plugins
  plugins: [
    // Plugin do Remix configurado para ambiente Shopify
    remix({
      // Ignorar arquivos que não devem ser tratados como rotas
      ignoredRouteFiles: ["**/.*", "**/*.test.{js,jsx,ts,tsx}"],

      // Adicionar o preset do Vercel para melhor compatibilidade
      presets: [vercelPreset()],

      // Habilitar novas funcionalidades do Remix V3
      future: {
        v3_fetcherPersist: true,
        v3_lazyRouteDiscovery: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true, // Adicionado para resolver o aviso do Router v7
      },

      // Configuração de desenvolvimento
      dev: {
        port: 8002, // Porta alternativa para dev server
      },

      // Configuração para o servidor
      serverModuleFormat: "esm",
      serverPlatform: "node",
    }),
  ],
});
