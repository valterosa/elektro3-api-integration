/**
 * Script para executar a aplicação com HTTPS localmente
 * Resolve o problema de CSP do Shopify Admin que requer HTTPS
 */

import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import fs from "fs";
import https from "https";
import selfsigned from "selfsigned";
import morgan from "morgan";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Configurações de caminhos para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Corrigindo o caminho do build para corresponder à estrutura do projeto
const BUILD_PATH = join(__dirname, "build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0/index.js");
const PORT = process.env.HTTPS_PORT || 3443; // Usar porta HTTPS padrão ou uma porta específica

// Verificar se o build existe
function buildExists() {
  return fs.existsSync(BUILD_PATH);
}

// Função para gerar certificados autoassinados
function generateCertificates() {
  console.log("🔑 Gerando certificados SSL autoassinados...");

  const pems = selfsigned.generate(
    [{ name: "commonName", value: "localhost" }],
    {
      algorithm: "sha256",
      days: 365,
      keySize: 2048,
      extensions: [
        { name: "basicConstraints", cA: true },
        {
          name: "keyUsage",
          keyCertSign: true,
          digitalSignature: true,
          nonRepudiation: true,
          keyEncipherment: true,
          dataEncipherment: true,
        },
        {
          name: "extKeyUsage",
          serverAuth: true,
          clientAuth: true,
        },
        {
          name: "subjectAltName",
          altNames: [
            {
              type: 2, // DNS
              value: "localhost",
            },
            {
              type: 7, // IP
              ip: "127.0.0.1",
            },
          ],
        },
      ],
    }
  );

  return {
    key: pems.private,
    cert: pems.cert,
  };
}

// Função para iniciar o servidor com o build gerado
async function startServer() {
  console.log("🚀 Iniciando servidor HTTPS local...");

  // Instalar globais do Remix
  installGlobals();

  const app = express();

  // Configurar middleware básico
  app.use(morgan("dev"));

  // Servir arquivos estáticos
  app.use(
    "/build",
    express.static("build/client", { immutable: true, maxAge: "1y" })
  );

  app.use(express.static("public", { maxAge: "1h" }));

  // Redirecionar HTTP para HTTPS
  app.use((req, res, next) => {
    if (!req.secure) {
      console.log(`Redirecionando ${req.url} para HTTPS...`);
    }
    next();
  });

  // Todas as outras requisições vão para o Remix
  app.all(
    "*",
    createRequestHandler({
      // Carregar o build existente
      build: await import(`file://${BUILD_PATH.replace(/\\/g, "/")}`),
      mode: process.env.NODE_ENV || "development",
    })
  );

  // Gerar certificados SSL autoassinados
  const credentials = generateCertificates();

  // Criar servidor HTTPS
  const httpsServer = https.createServer(credentials, app);

  return new Promise((resolve) => {
    httpsServer.listen(PORT, () => {
      console.log(`
✅ Servidor HTTPS iniciado com sucesso!

🔒 Acesso Local HTTPS:  https://localhost:${PORT}/
📊 Página principal:    https://localhost:${PORT}/app
🧪 Testar Conexões:     https://localhost:${PORT}/app/connection-test

⚠️  IMPORTANTE: Como estamos usando um certificado autoassinado:
   1. Seu navegador irá mostrar um aviso de segurança
   2. Clique em "Avançado" e depois "Prosseguir para localhost (não seguro)"
   3. Isso é normal durante o desenvolvimento local
   
🔗 Atualize a URL da app no Shopify Partners para: https://localhost:${PORT}/app
      `);
      resolve(httpsServer);
    });
  });
}

// Função principal
async function main() {
  try {
    if (!buildExists()) {
      console.error("❌ Build não encontrado! Execute primeiro: npm run build");
      process.exit(1);
    }

    await startServer();
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

// Iniciar a aplicação
main();
