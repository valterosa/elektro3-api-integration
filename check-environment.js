/**
 * Script para verificar e validar o ambiente local antes de iniciar a aplicação
 * Este script ajuda a garantir que todas as configurações necessárias estejam presentes
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import {
  ELEKTRO3_CONFIG,
  SHOPIFY_CONFIG,
  checkRequiredConfig,
} from "./app/config.js";

// Configurar __dirname no ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config();

console.log("🔍 Verificando ambiente local para Elektro3 API Integration...\n");

// Verificar arquivo .env
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error(
    "❌ Arquivo .env não encontrado. Por favor, crie o arquivo .env baseado no modelo .env.example"
  );
  process.exit(1);
}

console.log("✅ Arquivo .env encontrado");

// Verificar configurações necessárias
const configStatus = checkRequiredConfig();
if (!configStatus.allConfigPresent) {
  console.warn(
    "⚠️ Algumas configurações obrigatórias estão faltando no arquivo .env:"
  );

  if (configStatus.missing.elektro3.length > 0) {
    console.warn("   Elektro3:", configStatus.missing.elektro3.join(", "));
  }

  if (configStatus.missing.shopify.length > 0) {
    console.warn("   Shopify:", configStatus.missing.shopify.join(", "));
  }

  console.warn(
    "\nVocê ainda pode continuar, mas algumas funcionalidades podem não funcionar corretamente."
  );
} else {
  console.log("✅ Todas as configurações obrigatórias estão presentes");
}

// Verificar a estrutura do projeto
const libDir = path.join(__dirname, "app/lib");
if (!fs.existsSync(libDir)) {
  console.warn("⚠️ Diretório app/lib não encontrado. Criando diretório...");
  fs.mkdirSync(libDir, { recursive: true });
}

// Verificar se node_modules existe (dependências instaladas)
const nodeModulesPath = path.join(__dirname, "node_modules");
if (!fs.existsSync(nodeModulesPath)) {
  console.error(
    "❌ Diretório node_modules não encontrado. Por favor, execute 'npm install' primeiro."
  );
  process.exit(1);
}

console.log("✅ Dependências instaladas corretamente");

// Verificar se o banco de dados Prisma existe
const prismaDbPath = path.join(__dirname, "prisma/dev.sqlite");
if (!fs.existsSync(prismaDbPath)) {
  console.warn(
    "⚠️ Banco de dados SQLite não encontrado. Gerando banco de dados..."
  );
  try {
    execSync("npx prisma migrate dev --name init", { stdio: "inherit" });
    console.log("✅ Banco de dados criado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao criar banco de dados:", error.message);
    process.exit(1);
  }
} else {
  console.log("✅ Banco de dados SQLite encontrado");
}

// Checar a versão do Node.js
const nodeVersion = process.version;
console.log("ℹ️ Versão do Node.js:", nodeVersion);

const requiredNodeVersion = "18.20.0";
const currentVersionParts = nodeVersion.replace("v", "").split(".");
const requiredVersionParts = requiredNodeVersion.split(".");

if (
  parseInt(currentVersionParts[0]) < parseInt(requiredVersionParts[0]) ||
  (parseInt(currentVersionParts[0]) === parseInt(requiredVersionParts[0]) &&
    parseInt(currentVersionParts[1]) < parseInt(requiredVersionParts[1]))
) {
  console.warn(
    `⚠️ Versão do Node.js (${nodeVersion}) pode ser incompatível. Recomendado: v${requiredNodeVersion} ou superior.`
  );
} else {
  console.log("✅ Versão do Node.js compatível");
}

// Testar conexão com API da Elektro3 (opcional)
console.log(
  "\n🔄 Deseja testar a conexão com a API da Elektro3? (Isso pode demorar alguns segundos)"
);
console.log("   Se sim, execute: npm run test-connection");

// Instruções para executar localmente
console.log("\n🚀 Para executar a aplicação localmente:");
console.log(
  "   1. Execute 'npm run dev' para iniciar em modo de desenvolvimento"
);
console.log(
  "   2. Execute 'npm run build' e depois 'npm start' para simular produção\n"
);

console.log(
  "✨ Verificação concluída. O ambiente parece estar configurado corretamente."
);
