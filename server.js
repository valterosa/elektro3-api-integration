// server.js para execução local e produção
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { broadcastDevReady } from "@remix-run/node";

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar o build - atualizado para usar o novo caminho
const BUILD_PATH = path.resolve(__dirname, "build/server/index.js");

const app = express();

// Configurações básicas
app.disable("x-powered-by");

// Servir arquivos estáticos
app.use(express.static("public", { maxAge: "1h" }));

// Middleware para verificar o acesso à API
app.use((req, res, next) => {
  // Registrar solicitações para depuração
  console.log(`${req.method} ${req.path}`);
  next();
});

// Configurar Remix handler
const mode = process.env.NODE_ENV || "production";
const viteDevServer = process.env.NODE_ENV === "production" ? undefined : await import("vite").then(({ createServer }) => createServer());

app.all(
  "*",
  createRequestHandler({
    build: viteDevServer 
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build") 
      : await import(BUILD_PATH),
    mode,
    getLoadContext(req, res) {
      return { env: process.env };
    },
  })
);

// Iniciar servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  
  // Sinalizar que o servidor está pronto para desenvolvimento
  if (process.env.NODE_ENV === "development") {
    broadcastDevReady(await import(BUILD_PATH));
  }
});

export default app;
