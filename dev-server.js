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

  // Criar o servidor Vite
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: 64999,
        overlay: true,
      },
    },
    appType: "custom",
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

  // Configurar o handler do Remix
  app.all(
    "*",
    createRequestHandler({
      build: () => vite.ssrLoadModule("virtual:remix/server-build"),
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
