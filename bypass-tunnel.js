/**
 * Script para criar um túnel HTTPS sem a tela de senha
 * Usa cabeçalho bypass-tunnel-reminder para contornar a autenticação
 */

import { spawn, exec } from "child_process";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import dotenv from "dotenv";
import open from "open";

// Carregar variáveis de ambiente
dotenv.config();

const PORT = process.env.PORT || 3000;
const PROXY_PORT = 3333; // Porta local para o proxy

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

// Função para iniciar o túnel HTTPS
async function startTunnel() {
  console.log(`🔒 Iniciando túnel HTTPS para localhost:${PROXY_PORT}...`);
  
  // Iniciar o localtunnel sem subdomain específico para evitar conflitos
  const tunnelProcess = spawn("lt", ["--port", PROXY_PORT], {
    stdio: "pipe",
    shell: true,
  });
  
  let tunnelUrl = null;
  
  // Capturar e exibir a saída do túnel
  tunnelProcess.stdout.on("data", (data) => {
    const output = data.toString();
    console.log(output);
    
    // Procurar o URL do túnel na saída
    if (output.includes("your url is:")) {
      tunnelUrl = output.match(/your url is: (https:\/\/[^\s]+)/)[1];
      console.log(`
✅ Túnel HTTPS criado com sucesso!

🌐 URL do túnel HTTPS: ${tunnelUrl}
🔗 URL para a app:     ${tunnelUrl}/app

🔓 IMPORTANTE: Esse túnel tem bypass automático da senha!

🚨 Atualize a URL da app no Shopify Partners para:
   ${tunnelUrl}/app
   
   As URLs de redirecionamento devem incluir:
   ${tunnelUrl}/auth/callback
   ${tunnelUrl}/app/auth/callback
      `);
      
      // Abrir o URL da app no navegador
      console.log("📱 Abrindo URL da app no navegador...");
      open(`${tunnelUrl}/app`);
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

// Função para iniciar o servidor proxy
function startProxyServer() {
  console.log(`🔄 Iniciando servidor proxy na porta ${PROXY_PORT}...`);
  
  const app = express();
  
  // Middleware que adiciona o cabeçalho de bypass em todas as requisições
  app.use((req, res, next) => {
    req.headers['bypass-tunnel-reminder'] = 'true';
    next();
  });
  
  // Configurar o proxy para encaminhar todas as requisições para o servidor Remix
  app.use('/', createProxyMiddleware({
    target: `http://localhost:${PORT}`,
    changeOrigin: true,
    ws: true,
    logLevel: 'silent',
    onError: (err, req, res) => {
      console.error('Erro no proxy:', err);
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });
      res.end(`Erro ao conectar ao servidor local na porta ${PORT}. Certifique-se de que o servidor Remix esteja rodando.`);
    }
  }));
  
  // Iniciar o servidor proxy
  const server = app.listen(PROXY_PORT, () => {
    console.log(`✅ Servidor proxy iniciado na porta ${PROXY_PORT}`);
    console.log(`🔄 Redirecionando tráfego de localhost:${PROXY_PORT} para localhost:${PORT} com bypass automático`);
  });
  
  return server;
}

// Função principal
async function main() {
  console.log(`🚀 Iniciando túnel HTTPS com bypass automático da tela de senha...`);
  
  try {
    // Verificar se o localtunnel e http-proxy-middleware estão instalados
    try {
      await runCommand("lt --version");
    } catch (error) {
      console.error("❌ Localtunnel não está instalado ou não está no PATH.");
      console.log("📥 Por favor, instale-o com: npm install -g localtunnel");
      process.exit(1);
    }
    
    console.log(`⚠️ IMPORTANTE: Certifique-se de que seu servidor Remix está rodando na porta ${PORT}`);
    console.log(`   Se não estiver rodando, execute "npm run dev" em outro terminal primeiro.`);
    
    // Iniciar o servidor proxy
    const proxyServer = startProxyServer();
    
    // Iniciar o túnel HTTPS
    const tunnelProcess = await startTunnel();
    
    // Gerenciar encerramento
    const handleExit = () => {
      console.log("👋 Encerrando servidor proxy e túnel...");
      proxyServer.close();
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

// Iniciar o script
main();