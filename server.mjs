/**
 * Servidor Express para desenvolvimento e produção com Remix e Vite
 * Este arquivo resolve problemas de compatibilidade ESM/CommonJS e configuração de CSP
 */

import express from "express";
import compression from "compression";
import morgan from "morgan";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import * as fs from "fs";
import * as dotenv from "dotenv";

// Carregar variáveis de ambiente do arquivo .env antes de qualquer inicialização
dotenv.config();

// Verificar se as variáveis essenciais estão presentes
const requiredEnvVars = [
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SCOPES",
  "SHOPIFY_APP_URL",
];

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(
    "❌ Erro: As seguintes variáveis de ambiente são necessárias mas não foram definidas:"
  );
  missingVars.forEach((varName) => console.error(`   - ${varName}`));
  console.error(
    "\nPor favor, verifique seu arquivo .env e reinicie o servidor."
  );
}

// Estabelecer caminhos para contexto ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Instalar globais necessários para o Remix
installGlobals();

// Configurações
const DEFAULT_PORT = process.env.PORT || 3000;
const MODE = process.env.NODE_ENV || "development";
const isProduction = MODE === "production";

// Função para encontrar uma porta disponível
async function findAvailablePort(startPort) {
  const net = await import("net");

  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      // Porta em uso, tentar a próxima
      resolve(findAvailablePort(startPort + 1));
    });

    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort);
      });
    });
  });
}

// Função para construir a configuração CSP
function generateCSP() {
  const directives = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://cdn.shopify.com",
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "font-src": ["'self'", "https://fonts.gstatic.com"],
    "img-src": ["'self'", "data:", "https:", "http:"],
    "connect-src": [
      "'self'",
      "https://api.elektro3.com",
      "https://*.myshopify.com",
      "wss:",
      "ws:",
    ],
    "frame-src": [
      "'self'",
      "https://cdn.shopify.com",
      "https://*.myshopify.com",
    ],
    "frame-ancestors": [
      "'self'",
      "https://*.myshopify.com",
      "https://admin.shopify.com",
    ],
  };

  // Adicionar configurações específicas para desenvolvimento
  if (!isProduction) {
    directives["connect-src"].push("http://localhost:*");
    directives["script-src"].push("http://localhost:*");
  }

  // Converter diretivas em string de CSP
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

async function startServer() {
  // Encontrar uma porta disponível
  const PORT = await findAvailablePort(DEFAULT_PORT);
  const isDefaultPort = PORT === DEFAULT_PORT;

  // Criar aplicação Express
  const app = express();

  // Middleware básicos
  app.disable("x-powered-by");
  app.use(compression());
  app.use(morgan("tiny"));

  // Adicionar CSP e outros headers de segurança
  app.use((req, res, next) => {
    // Configurar Content Security Policy
    res.setHeader("Content-Security-Policy", generateCSP());

    // Outros headers de segurança importantes
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");

    next();
  });

  // Configurar build com base no ambiente
  let build;
  let viteDevServer;

  if (isProduction) {
    // Em produção, usar o build compilado
    build = await import("./build/server/index.js");

    // Servir assets estáticos do cliente
    app.use(
      "/assets",
      express.static("build/client/assets", {
        immutable: true,
        maxAge: "1y",
      })
    );
    app.use(express.static("build/client", { maxAge: "1h" }));
    app.use(express.static("public", { maxAge: "1h" }));
  } else {
    // Em desenvolvimento, configurar o Vite para HMR
    const { createServer } = await import("vite");

    // Procurar uma porta disponível para o HMR
    const HMR_PORT = await findAvailablePort(24680);

    viteDevServer = await createServer({
      server: {
        middlewareMode: true,
        hmr: {
          // Usando porta diferente para evitar conflitos
          port: HMR_PORT,
          // Não especificar host para usar o default
          host: null,
          protocol: "ws",
        },
      },
      appType: "custom",
      // Certificar-se de que o build do servidor usa o formato ESM
      optimizeDeps: {
        force: true,
      },
    });

    // Usar middleware do Vite
    app.use(viteDevServer.middlewares);

    // Configurar build para usar SSR do Vite
    build = () => viteDevServer.ssrLoadModule("virtual:remix/server-build");
  }

  // Configurar handler de requisições do Remix
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

  // Iniciar servidor
  app.listen(PORT, () => {
    console.log(`
🚀 Servidor ${isProduction ? "de produção" : "de desenvolvimento"} iniciado!

📱 Local: http://localhost:${PORT}/ ${!isDefaultPort ? `(porta alternativa: ${PORT})` : ""}
    `);

    if (!isProduction) {
      console.log(`
🔎 Rotas importantes:
📊 Página inicial:      http://localhost:${PORT}/
🔌 Testar conexões:     http://localhost:${PORT}/app/connection-test
🛒 Administração:       http://localhost:${PORT}/app
      `);
    }
  });

  return app;
}

// Tratar erros não capturados
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

// Iniciar o servidor
startServer().catch((error) => {
  console.error("Erro fatal ao iniciar o servidor:", error);
  process.exit(1);
});
