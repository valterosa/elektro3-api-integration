import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script para corrigir os problemas de importação no projeto

console.log("🔧 Iniciando correção de importações problemáticas...");

// 1. Corrigir os arquivos nas rotas que usam "~/"
const routesDir = path.resolve(__dirname, "app/routes");

function updateImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`Arquivo não encontrado: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;

  // Substituir importações com "~/" por caminhos relativos
  content = content.replace(
    /from\s+(['"])~\/lib\/([^'"]+)\1/g,
    (match, quote, importPath) => {
      // Calcular caminho relativo
      const relativeDir = path
        .relative(path.dirname(filePath), path.resolve(__dirname, "app/lib"))
        .replace(/\\/g, "/");

      return `from ${quote}${relativeDir}/${importPath}${quote}`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Atualizado: ${filePath}`);
    return true;
  }

  return false;
}

// Corrigir arquivos específicos
const filesToFix = [
  path.resolve(routesDir, "app._index.jsx"),
  path.resolve(routesDir, "app.jsx"),
  path.resolve(routesDir, "app.graphql-admin-api.jsx"),
];

console.log("\n📄 Corrigindo arquivos de rotas...");
let fixedCount = 0;
for (const file of filesToFix) {
  if (updateImportsInFile(file)) {
    fixedCount++;
  }
}
console.log(`Arquivos corrigidos: ${fixedCount}/${filesToFix.length}`);

// 2. Verificar se o diretório /lib existe e criar arquivos faltantes
const libDir = path.resolve(__dirname, "app/lib");
if (!fs.existsSync(libDir)) {
  console.log("\n📁 Criando diretório lib...");
  fs.mkdirSync(libDir, { recursive: true });
}

// 3. Corrigir node_modules com script existente
console.log("\n🔄 Executando patch para arquivos do Shopify...");
try {
  execSync("node patch-shopify-imports.js", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Erro ao executar patch-shopify-imports.js:", error.message);
}

// 4. Limpar cache e construir novamente
console.log("\n🧹 Limpando cache...");
try {
  if (fs.existsSync(path.resolve(__dirname, "build"))) {
    fs.rmSync(path.resolve(__dirname, "build"), {
      recursive: true,
      force: true,
    });
  }

  const cacheDir = path.resolve(__dirname, "node_modules/.cache");
  if (fs.existsSync(cacheDir)) {
    fs.rmSync(cacheDir, { recursive: true, force: true });
  }

  console.log("✅ Cache limpo com sucesso!");
} catch (error) {
  console.error("❌ Erro ao limpar cache:", error.message);
}

console.log("\n✅ Correções aplicadas! Execute 'npm run build' novamente.");
