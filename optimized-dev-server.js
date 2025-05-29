/**
 * Servidor Remix Vite otimizado para desenvolvimento local
 * Contorna o erro de server-build importando diretamente o módulo compilado
 */

import express from "express";
import morgan from "morgan";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { spawn } from "child_process";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Configurações de caminhos
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3000;
const REMIX_CONFIG_PATH = join(__dirname, "remix.config.js");

// Utilitários
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Criar uma build de desenvolvimento
 */
async function createDevBuild() {
  return new Promise((resolve, reject) => {
    console.log("🔨 Gerando build inicial para desenvolvimento...");

    // Em Windows, precisamos usar 'npm.cmd' em vez de 'npm'
    const isWindows = process.platform === "win32";
    const npm = isWindows ? "npm.cmd" : "npm";

    const buildProcess = spawn(npm, ["run", "build"], {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, NODE_ENV: "development" },
    });

    buildProcess.on("exit", (code) => {
      if (code === 0) {
        console.log("✅ Build de desenvolvimento criado com sucesso!");
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

/**
 * Iniciar o servidor de desenvolvimento
 */
async function startDevServer() {
  try {
    // Verificar configuração do Remix
    if (!fs.existsSync(REMIX_CONFIG_PATH)) {
      throw new Error(
        `Arquivo de configuração do Remix não encontrado: ${REMIX_CONFIG_PATH}`
      );
    }

    // Criar build inicial
    await createDevBuild();

    // Servidor Express para servir ativos estáticos e lidar com SSR
    const app = express();
    app.use(morgan("dev"));

    // Criar servidor Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
      optimizeDeps: {
        entries: ["app/**/*.{js,jsx,ts,tsx}"],
        force: true,
      },
      clearScreen: false,
      logLevel: "info",
    });

    // Usar middleware Vite para HMR e transformação de módulos
    app.use(vite.middlewares);

    // Servir arquivos estáticos da pasta public
    app.use(express.static("public"));

    // Servir os arquivos do cliente build
    app.use("/build", express.static("build/client"));

    // Rota para todos os outros pedidos - SSR
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        // Carregar o módulo Remix Express Handler
        const { createRequestHandler } =
          await vite.ssrLoadModule("@remix-run/express");

        // Carregar o build do servidor diretamente em vez de usar o módulo virtual
        const BUILD_DIR = join(
          __dirname,
          "build/server/nodejs-eyJydW50aW1lIjoibm9kZWpzIn0"
        );
        const BUILD_PATH = join(BUILD_DIR, "index.js");
        const BUILD_URL = `file://${BUILD_PATH.replace(/\\/g, "/")}`;

        // Tentar carregar o build
        let build;
        try {
          // Carregar build com URL
          build = await import(BUILD_URL);
        } catch (e) {
          console.error("❌ Erro ao carregar o build do servidor:", e.message);
          console.log("🔄 Utilizando carregamento alternativo...");

          // Tente a segunda abordagem se a primeira falhar
          try {
            build = await vite.ssrLoadModule("virtual:remix/server-build");
          } catch (e2) {
            console.error("❌ Ambos os métodos de carregamento falharam");
            throw e2;
          }
        }

        // Criar handler do Remix
        const handler = createRequestHandler({
          build,
          mode: "development",
          getLoadContext(req, res) {
            return { req, res };
          },
        });

        // Processar a requisição
        handler(req, res, next);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        console.error("❌ Erro ao processar requisição:", error);
        next(error);
      }
    });

    // Iniciar servidor
    app.listen(PORT, "localhost", () => {
      console.log(`
✅ Servidor de desenvolvimento Remix+Vite iniciado!

📱 Local: http://localhost:${PORT}/
📊 App: http://localhost:${PORT}/app
      `);
    });
  } catch (error) {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }
}

// Iniciar o servidor
startDevServer();
