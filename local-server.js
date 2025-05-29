/**
 * Servidor local otimizado para desenvolvimento sem problemas do Vercel Remix
 */

import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import { createServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import morgan from "morgan";

// Instalar globais do Remix
installGlobals();

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

async function startServer() {
  console.log("🚀 Iniciando servidor local otimizado...");

  // Criar o servidor Vite com configurações básicas
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: 64999,
        overlay: true,
      },
    },
    appType: "custom",
    optimizeDeps: {
      entries: ["app/**/*.{js,jsx,ts,tsx}"],
      force: true,
    },
  });

  const app = express();

  // Middleware básicos
  app.use(morgan("dev"));
  app.use(express.static("public", { maxAge: "1h" }));
  app.use(vite.middlewares);

  // Substitui a função createRequestHandler do @vercel/remix pela do @remix-run/express
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
✅ Servidor otimizado iniciado!

📱 Local:               http://localhost:${PORT}/
📊 Página principal:    http://localhost:${PORT}/app
🧪 Testar Conexões:     http://localhost:${PORT}/app/connection-test
    `);
  });
}

startServer().catch((error) => {
  console.error("❌ Erro ao iniciar o servidor:", error);
  process.exit(1);
});
