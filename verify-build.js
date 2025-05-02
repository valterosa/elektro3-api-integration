import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obter o diretório atual em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar o diretório build
const buildDir = path.resolve(__dirname, "build");
const serverBuildPath = path.resolve(__dirname, "build/index.js");

console.log("== Verificação do Build ==");

if (!fs.existsSync(buildDir)) {
  console.error("❌ O diretório build não existe!");
  console.log(
    "Execute 'npm run build' primeiro para gerar os arquivos de build."
  );
  process.exit(1);
} else {
  console.log("✅ O diretório build existe!");

  // Listar conteúdo do diretório build
  console.log("\nConteúdo do diretório build:");
  fs.readdirSync(buildDir).forEach((file) => {
    console.log(`- ${file}`);

    // Se tiver um diretório server, vamos listar seu conteúdo também
    if (
      file === "server" &&
      fs.statSync(path.join(buildDir, file)).isDirectory()
    ) {
      console.log("\nConteúdo do diretório build/server:");
      fs.readdirSync(path.join(buildDir, "server")).forEach((serverFile) => {
        console.log(`  - ${serverFile}`);

        // Se for um diretório, vamos verificar se contém index.js
        const serverItemPath = path.join(buildDir, "server", serverFile);
        if (fs.statSync(serverItemPath).isDirectory()) {
          const indexPath = path.join(serverItemPath, "index.js");
          if (fs.existsSync(indexPath)) {
            console.log(`    ✅ Contém index.js`);

            // Criar redirecionamento na raiz, se necessário
            if (!fs.existsSync(serverBuildPath)) {
              console.log(
                "\nCriando redirecionamento para o build encontrado..."
              );

              // Caminho relativo para o arquivo index.js
              const relativePath = `./server/${serverFile}/index.js`;

              // Criar o arquivo de redirecionamento
              const redirectContent = `// Arquivo de redirecionamento gerado automaticamente
export * from '${relativePath}';
`;
              fs.writeFileSync(serverBuildPath, redirectContent);
              console.log("✅ Redirecionamento criado com sucesso!");
            }
          }
        }
      });
    }
  });
}

// Verificar se o arquivo principal existe agora
if (fs.existsSync(serverBuildPath)) {
  console.log(`\n✅ O arquivo de build está disponível em: ${serverBuildPath}`);
  console.log("✅ O servidor pode ser iniciado com 'npm run start'");
} else {
  console.error(
    "\n❌ Não foi possível localizar ou criar o arquivo de build principal."
  );
  console.error("Execute 'npm run build' e tente novamente.");
}

console.log("\n== Fim da Verificação ==");
