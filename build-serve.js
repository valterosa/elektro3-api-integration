/**
 * Script para desenvolvimento local com build pré-gerado
 * Solução para o erro: "@remix-run/dev/server-build is not meant to be used directly"
 */

import express from "express";
import { createRequestHandler } from "@remix-run/express";
import { installGlobals } from "@remix-run/node";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import morgan from "morgan";
import { spawn } from "child_process";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Configurações de caminhos para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Corrigindo caminho para o build gerado pelo Remix 2.x
const BUILD_DIR = path.join(
  __dirname,
  "build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0"
);
const BUILD_PATH = path.join(BUILD_DIR, "index.js");
const BUILD_URL = new URL(`file://${BUILD_PATH.replace(/\\/g, "/")}`);
const PORT = process.env.PORT || 3000;

// Verificar se o build existe
function buildExists() {
  return fs.existsSync(BUILD_PATH);
}

// Função para construir a aplicação
async function buildApp() {
  console.log("🔨 Construindo a aplicação...");

  return new Promise((resolve, reject) => {
    // Em Windows, precisamos usar 'npm.cmd' em vez de 'npm'
    const isWindows = process.platform === "win32";
    const npm = isWindows ? "npm.cmd" : "npm";

    const buildProcess = spawn(npm, ["run", "build"], {
      stdio: "inherit",
      shell: true,
    });

    buildProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("✅ Build concluído com sucesso!");
        resolve();
      } else {
        console.error(`❌ Build falhou com código de saída ${code}`);
        reject(new Error(`Build falhou com código ${code}`));
      }
    });

    buildProcess.on("error", (err) => {
      console.error("❌ Erro ao executar o build:", err);
      reject(err);
    });
  });
}

// Função para iniciar o servidor com o build gerado
async function startServer() {
  console.log("🚀 Iniciando servidor local com build pré-gerado...");

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

  // Todas as outras requisições vão para o Remix
  app.all(
    "*",
    createRequestHandler({
      // Usar URL com formato correto para Windows para importação ESM
      build: await import(BUILD_URL.href),
      mode: "development",
    })
  );

  return new Promise((resolve) => {
    app.listen(PORT, () => {
      console.log(`
✅ Servidor local iniciado com sucesso!

📱 Acesso Local:        http://localhost:${PORT}/
📊 Página principal:    http://localhost:${PORT}/app
🧪 Testar Conexões:     http://localhost:${PORT}/app/connection-test
      `);
      resolve(app);
    });
  });
}

// Função principal
async function main() {
  try {
    if (!buildExists()) {
      console.log("🔍 Build não encontrado, gerando um novo...");
      await buildApp();
    } else {
      console.log("🔍 Build existente encontrado");
      const rebuildPrompt = "Deseja reconstruir a aplicação? (s/N): ";

      // No ambiente de script automatizado, não perguntar
      console.log(`${rebuildPrompt}N (automático)`);
      console.log("🔄 Usando build existente...");
    }

    await startServer();
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

// Iniciar a aplicação
main();
