/**
 * Script para iniciar o servidor local e criar um túnel HTTPS
 * Solução para o problema de CSP do Shopify Admin
 */

import { spawn, exec } from "child_process";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

const PORT = process.env.PORT || 3000;

// Função para executar comandos e retornar a saída
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Erro ao executar o comando: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`Erro do comando: ${stderr}`);
      }
      resolve(stdout);
    });
  });
}

// Função para iniciar o servidor local
function startLocalServer() {
  console.log("🚀 Iniciando servidor local na porta", PORT);

  // Em Windows, precisamos usar 'npm.cmd' em vez de 'npm'
  const isWindows = process.platform === "win32";
  const npm = isWindows ? "npm.cmd" : "npm";

  const serverProcess = spawn(npm, ["run", "dev:build-serve"], {
    stdio: "inherit",
    shell: true,
  });

  serverProcess.on("error", (error) => {
    console.error("❌ Erro ao iniciar o servidor local:", error);
    process.exit(1);
  });

  // Retornar o processo para que possamos encerrar mais tarde
  return serverProcess;
}

// Função para iniciar o túnel HTTPS
async function startTunnel() {
  // Esperar um pouco para o servidor iniciar
  console.log("⏳ Aguardando o servidor local iniciar...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log(`🔒 Iniciando túnel HTTPS para localhost:${PORT}...`);

  // Iniciar o localtunnel com um subdomínio personalizado
  const tunnelProcess = spawn(
    "lt",
    ["--port", PORT, "--subdomain", "elektro3-app"],
    {
      stdio: "pipe",
      shell: true,
    }
  );

  // Capturar e exibir a saída do túnel
  tunnelProcess.stdout.on("data", (data) => {
    const output = data.toString();
    console.log(output);

    // Procurar o URL do túnel na saída
    if (output.includes("your url is:")) {
      const tunnelUrl = output.match(/your url is: (https:\/\/[^\s]+)/)[1];
      console.log(`
✅ Túnel HTTPS criado com sucesso!

🌐 URL do túnel HTTPS: ${tunnelUrl}
🔗 URL para a app:     ${tunnelUrl}/app

🚨 IMPORTANTE: Atualize a URL da app no Shopify Partners para:
   ${tunnelUrl}/app
      `);
    }
  });

  tunnelProcess.stderr.on("data", (data) => {
    console.error(`❌ Erro do túnel: ${data}`);
  });

  tunnelProcess.on("error", (error) => {
    console.error("❌ Erro ao iniciar o túnel HTTPS:", error);
    process.exit(1);
  });

  // Retornar o processo para que possamos encerrar mais tarde
  return tunnelProcess;
}

// Função principal
async function main() {
  console.log("🚀 Iniciando servidor com túnel HTTPS...");

  try {
    // Verificar se o localtunnel está instalado
    try {
      await runCommand("lt --version");
    } catch (error) {
      console.error("❌ Localtunnel não está instalado ou não está no PATH.");
      console.log("📥 Por favor, instale-o com: npm install -g localtunnel");
      process.exit(1);
    }

    // Iniciar o servidor local e o túnel HTTPS
    const serverProcess = startLocalServer();
    const tunnelProcess = await startTunnel();

    // Gerenciar encerramento
    const handleExit = () => {
      console.log("👋 Encerrando servidor e túnel...");
      serverProcess.kill();
      tunnelProcess.kill();
      process.exit(0);
    };

    // Ouvir eventos de encerramento
    process.on("SIGINT", handleExit);
    process.on("SIGTERM", handleExit);
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

// Iniciar a aplicação
main();
