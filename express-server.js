/**
 * Ponto de entrada para o Express
 * Este arquivo serve como adaptador entre o Remix e o Express
 */

import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import compression from "compression";
import morgan from "morgan";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import os from "os"; // Importação ESM correta para o módulo os

// Carregar variáveis de ambiente
dotenv.config();

// Estabelecer caminhos para contexto ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instalar globais necessários para o Remix
installGlobals();

// Definir modo (desenvolvimento ou produção)
const MODE = process.env.NODE_ENV || "production";
const isProduction = MODE === "production";
const PORT = process.env.PORT || 3000;

/**
 * Iniciar o servidor Express com configurações para ambiente de desenvolvimento e produção
 */
async function startServer() {
  const app = express();

  // Configurações básicas
  app.disable("x-powered-by");
  app.use(compression());
  app.use(morgan("tiny"));

  // Servir arquivos estáticos
  app.use(express.static("public", { maxAge: isProduction ? "1h" : "0" }));

  // Middleware para log de requisições em modo de desenvolvimento
  if (!isProduction) {
    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });
  }

  // Determinar qual build usar com base no ambiente
  let build;
  if (isProduction) {
    // Em produção, importa o build compilado
    build = await import("./build/server/index.js");
  } else {
    // Em desenvolvimento, configurar o Vite para HMR
    const vite = await import("vite");
    const viteDevServer = await vite.createServer({
      server: {
        middlewareMode: true,
        // Configuração corrigida para o HMR sem especificar host - apenas porta
        hmr: {
          port: 24678, // Porta alternativa para HMR
          host: undefined, // Não especificar o host para usar localhost
          protocol: "ws", // Usar protocolo WebSocket
        },
      },
      appType: "custom",
    });

    // Usar o Vite como middleware
    app.use(viteDevServer.middlewares);

    // Configurar o build para usar o servidor Vite
    build = async () => {
      try {
        return await viteDevServer.ssrLoadModule("virtual:remix/server-build");
      } catch (error) {
        console.error("Erro ao carregar o módulo SSR:", error);
        throw error;
      }
    };
  }

  // Configurar o handler do Remix
  app.all(
    "*",
    createRequestHandler({
      build,
      mode: MODE,
      getLoadContext(req, res) {
        return {
          env: process.env,
          req,
          res,
        };
      },
    })
  );

  // Iniciar o servidor na porta configurada
  app.listen(PORT, () => {
    console.log(`
🚀 Servidor ${isProduction ? "de produção" : "de desenvolvimento"} iniciado!

📱 Local:           http://localhost:${PORT}/
    `);

    if (!isProduction) {
      console.log(`
🔎 Rotas disponíveis:
📊 Página Inicial:  http://localhost:${PORT}/
🔌 Testar Conexões: http://localhost:${PORT}/app/connection-test
📱 App Principal:   http://localhost:${PORT}/app
      `);
    }
  });

  return app;
}

/**
 * Função auxiliar para obter o endereço IP local (usando importação ESM)
 */
function getLocalIpAddress() {
  const nets = os.networkInterfaces();
  const results = {};

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Ignorar interfaces de loopback e não IPv4
      if (net.family === "IPv4" && !net.internal) {
        if (!results[name]) {
          results[name] = [];
        }
        results[name].push(net.address);
      }
    }
  }

  // Retornar o primeiro IP encontrado ou localhost
  for (const name of Object.keys(results)) {
    if (results[name] && results[name].length > 0) {
      return results[name][0];
    }
  }
  return "127.0.0.1";
}

// Iniciar o servidor
startServer().catch((error) => {
  console.error("Erro ao iniciar o servidor:", error);
  process.exit(1);
});
