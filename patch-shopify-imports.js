import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Arquivo que contém o problema
const filePath = path.resolve(
  __dirname,
  "node_modules/@shopify/shopify-app-remix/dist/esm/react/components/AppProvider/AppProvider.mjs"
);

if (fs.existsSync(filePath)) {
  console.log(`Corrigindo arquivo: ${filePath}`);

  try {
    // Ler o conteúdo do arquivo
    let content = fs.readFileSync(filePath, "utf8");
    console.log("Conteúdo original das primeiras linhas:");
    console.log(content.substring(0, 200) + "...");

    // Versão mais simples: substituir todo o arquivo
    // Vamos reescrever completamente a linha problemática
    const originalLine =
      "import I18n from '@shopify/polaris/locales/en.json' with { type: 'json' };";
    const newLine = "import I18n from '@shopify/polaris/locales/en.json';";

    if (content.includes(originalLine)) {
      console.log("Encontrada a linha exata para substituição!");
      content = content.replace(originalLine, newLine);
    } else {
      // Método alternativo: buscar e substituir padrão mais genérico
      console.log("Usando método de substituição alternativo...");
      const regex =
        /import\s+I18n\s+from\s+(['"])@shopify\/polaris\/locales\/en\.json\1\s+with\s+\{\s*type:\s*(['"])json\2\s*\};/g;

      if (regex.test(content)) {
        console.log("Padrão encontrado com regex!");
        content = content.replace(regex, newLine);
      } else {
        // Última tentativa: método mais bruto
        console.log("Tentando método mais direto...");
        content = content.replace(
          /from\s+(['"])@shopify\/polaris\/locales\/en\.json\1\s+with/,
          "from $1@shopify/polaris/locales/en.json$1"
        );
      }
    }

    // Escrever de volta ao arquivo
    fs.writeFileSync(filePath, content);
    console.log("✅ Arquivo processado. Novas primeiras linhas:");
    console.log(content.substring(0, 200) + "...");

    // Verificar se ainda contém 'with'
    if (
      content.includes(" with { type: 'json' }") ||
      content.includes(' with { type: "json" }')
    ) {
      console.warn(
        "⚠️ AVISO: O texto 'with { type: json }' ainda está presente no arquivo!"
      );

      // Método mais direto: editar o arquivo como texto simples
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (
          lines[i].includes("polaris/locales/en.json") &&
          lines[i].includes("with")
        ) {
          console.log(`Encontrada linha problemática (${i + 1}): ${lines[i]}`);
          // Remover a parte 'with { type: "json" }'
          lines[i] = lines[i].replace(
            /with\s+\{\s*type:\s*(['"])json\1\s*\}/,
            ""
          );
          console.log(`Nova linha: ${lines[i]}`);
        }
      }
      content = lines.join("\n");
      fs.writeFileSync(filePath, content);
      console.log("✅ Segunda tentativa de correção aplicada!");
    }
  } catch (error) {
    console.error("❌ Erro ao processar o arquivo:", error);
  }
} else {
  console.error(`❌ Arquivo não encontrado: ${filePath}`);

  // Tentar encontrar onde está o arquivo
  console.log("Procurando por arquivos AppProvider.mjs...");
  const findAppProviderFiles = (dir) => {
    if (!fs.existsSync(dir)) return [];

    const results = [];
    const list = fs.readdirSync(dir);

    for (const file of list) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        results.push(...findAppProviderFiles(fullPath));
      } else if (
        file === "AppProvider.mjs" ||
        file.endsWith("AppProvider.js")
      ) {
        results.push(fullPath);
      }
    }

    return results;
  };

  const nodeModulesPath = path.resolve(__dirname, "node_modules");
  const appProviderFiles = findAppProviderFiles(nodeModulesPath);

  if (appProviderFiles.length > 0) {
    console.log("Encontrados os seguintes arquivos AppProvider:");
    appProviderFiles.forEach((file) => console.log(` - ${file}`));
  } else {
    console.log("Nenhum arquivo AppProvider.mjs encontrado.");
  }
}

// Verificar também por importações problemáticas em outros arquivos
console.log("\nProcurando por outras importações problemáticas...");

const checkForImportIssues = (dir) => {
  if (!fs.existsSync(dir)) return;

  const list = fs.readdirSync(dir);

  for (const file of list) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      checkForImportIssues(fullPath);
    } else if (
      file.endsWith(".js") ||
      file.endsWith(".jsx") ||
      file.endsWith(".mjs")
    ) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");
        if (content.includes("polaris/locales") && content.includes("with")) {
          console.log(`Encontrado arquivo com potencial problema: ${fullPath}`);

          // Corrigir o arquivo
          const updatedContent = content.replace(
            /from\s+(['"])@shopify\/polaris\/locales\/[^'"]+\1\s+with\s+\{\s*type:\s*(['"])json\2\s*\}/g,
            "from $1@shopify/polaris/locales/en.json$1"
          );

          if (content !== updatedContent) {
            fs.writeFileSync(fullPath, updatedContent);
            console.log(`✅ Corrigido: ${fullPath}`);
          }
        }
      } catch (e) {
        console.error(`Erro ao ler ${fullPath}:`, e.message);
      }
    }
  }
};

checkForImportIssues(path.resolve(__dirname, "node_modules/@shopify"));

console.log("\nVerificação concluída!");
