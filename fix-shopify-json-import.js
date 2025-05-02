import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para o arquivo problemático
const targetFile = path.resolve(
  __dirname,
  "node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProvider/AppProvider.mjs"
);

console.log(
  `🔧 Corrigindo problemas de importação JSON no arquivo: ${targetFile}`
);

if (!fs.existsSync(targetFile)) {
  console.error("❌ Arquivo não encontrado!");
  process.exit(1);
}

// Ler o conteúdo do arquivo
let content = fs.readFileSync(targetFile, "utf8");
console.log("Conteúdo original das primeiras linhas:");
console.log(content.substring(0, 200));

// Identificar a linha problemática exata
const lines = content.split("\n");
const problematicLine = lines.find(
  (line) =>
    line.includes("polaris/locales/en.json") &&
    (line.includes("with {") || line.includes("{ type:"))
);

if (problematicLine) {
  console.log(`\nLinha problemática encontrada: "${problematicLine}"`);

  // Criar uma versão corrigida da linha
  let correctedLine = problematicLine;

  // Corrigir diferentes variações do problema
  if (correctedLine.includes("with { type:")) {
    correctedLine = correctedLine.replace(
      /with\s+{\s*type:\s*['"]json['"]\s*}/,
      ""
    );
  } else if (correctedLine.includes("{ type:")) {
    correctedLine = correctedLine.replace(/\{\s*type:\s*['"]json['"]\s*}/, "");
  }

  console.log(`Linha corrigida: "${correctedLine}"`);

  // Substituir a linha no conteúdo
  content = content.replace(problematicLine, correctedLine);

  // Escrever de volta ao arquivo
  fs.writeFileSync(targetFile, content);
  console.log("✅ Arquivo corrigido com sucesso!");
} else {
  console.log("⚠️ Linha problemática não encontrada pelo padrão esperado.");

  // Método alternativo: reescrever o arquivo completamente
  console.log("Tentando método alternativo de correção...");

  // Criar uma cópia de backup do arquivo original
  fs.writeFileSync(`${targetFile}.bak`, content);
  console.log(`Backup criado: ${targetFile}.bak`);

  // Reescrever o arquivo com a correção aplicada usando uma expressão regular mais genérica
  content = content.replace(
    /(from\s+['"])(@shopify\/polaris\/locales\/[^'"]+)(['"])\s*{\s*type:\s*['"]json['"]\s*}/g,
    "$1$2$3"
  );

  fs.writeFileSync(targetFile, content);
  console.log("✅ Correção alternativa aplicada!");
}

// Verificar se ainda há problemas no arquivo
if (
  content.includes("{ type: 'json' }") ||
  content.includes('{ type: "json" }')
) {
  console.warn(
    '⚠️ AVISO: Ainda existem referências a "{ type: json }" no arquivo!'
  );

  // Método mais drástico: editar manualmente a linha 3
  lines[2] = lines[2].replace(
    /(['"])@shopify\/polaris\/locales\/en\.json\1\s*{\s*type:\s*['"]json['"]\s*}/,
    "$1@shopify/polaris/locales/en.json$1"
  );

  content = lines.join("\n");
  fs.writeFileSync(targetFile, content);
  console.log("✅ Correção manual da linha 3 aplicada!");
}

console.log("\nProcesso de correção concluído!");
