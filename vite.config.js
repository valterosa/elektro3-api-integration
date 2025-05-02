import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import { installGlobals } from "@remix-run/node";
import { resolve } from "path";

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
    hmr: {
      // O servidor Express já configura o HMR com uma porta disponível
      clientPort: "auto", // Usar detecção automática
      port: "auto", // Deixar o Vite escolher uma porta disponível
      host: "localhost",
      protocol: "ws",
    },
  },

  // Configurações específicas para build do servidor
  ssr: {
    noExternal: [
      // Pacotes que precisam ser incluídos no bundle do servidor
      "@shopify/shopify-app-remix",
      "@shopify/polaris",
      /^@shopify\/app-bridge.*$/,
      // Adicionar quaisquer outros que causem problemas
    ],
    target: "node",
    format: "esm",
  },

  // Configuração de otimização
  optimizeDeps: {
    // Forçar a inclusão de todos os módulos compatíveis
    include: ["react", "react-dom", "@shopify/polaris", "isbot"],
  },

  // Plugins
  plugins: [
    // Plugin do Remix configurado para ambiente Shopify
    remix({
      // Ignorar arquivos que não devem ser tratados como rotas
      ignoredRouteFiles: ["**/.*", "**/*.test.{js,jsx,ts,tsx}"],

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
