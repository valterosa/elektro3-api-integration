/**
 * Script para iniciar a aplicação em modo de desenvolvimento
 * Esta versão alternativa não depende do Shopify CLI para o desenvolvimento local
 */

import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import { createServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

// Instalar globais do Remix
installGlobals();

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const BUILD_PATH = path.resolve(__dirname, "build/server/index.js");

async function startServer() {
  console.log("🚀 Iniciando servidor de desenvolvimento local...");

  // Criar o servidor Vite com configurações atualizadas
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: 64999,
        overlay: true,
      },
    },
    appType: "custom",
    // Adicionando configuração para garantir que o build do Remix funcione
    optimizeDeps: {
      entries: [
        "app/**/*.{js,jsx,ts,tsx}",
      ],
      force: true
    },
    // Adicionado para resolver problemas com o Remix 2.x
    resolve: {
      alias: {
        "@remix-run/dev/server-build": path.resolve(__dirname, "./build/server/index.js")
      }
    }
  });

  const app = express();

  // Middleware para servir arquivos estáticos
  app.use(express.static("public", { maxAge: "1h" }));

  // Usar o vite como middleware
  app.use(vite.middlewares);

  // Middleware para log de requisições
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Configurar o handler do Remix com abordagem alternativa
  app.all(
    "*",
    createRequestHandler({
      // Abordagem atualizada para o Remix 2.x
      build: async (request) => {
        try {
          // Primeiro tentar carregar pelo módulo virtual
          return await vite.ssrLoadModule("virtual:remix/server-build");
        } catch (e) {
          console.warn("Erro ao carregar módulo virtual, tentando abordagem alternativa:", e.message);
          
          // Abordagem alternativa - criar o build pela primeira vez
          try {
            return await vite.ssrLoadModule("./build/server/index.js");
          } catch (e2) {
            console.error("Falha ao carregar o build:", e2);
            throw e2;
          }
        }
      },
      mode: "development",
      getLoadContext(req, res) {
        return {
          env: process.env,
          req,
          res,
        };
      },
    })
  );

  app.listen(PORT, () => {
    console.log(`
🔥 Servidor de desenvolvimento iniciado!

📱 Local:               http://localhost:${PORT}/
🧪 Testar Conexões:     http://localhost:${PORT}/app/connection-test
🔍 Verificar Ambiente:  npm run check-env
    `);
  });
}

startServer().catch((error) => {
  console.error("❌ Erro ao iniciar o servidor:", error);
  process.exit(1);
});
