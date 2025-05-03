// prisma-setup.js
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

// Função para verificar se estamos no ambiente Vercel em produção
function isVercelProduction() {
  return process.env.VERCEL === "1" && process.env.NODE_ENV === "production";
}

// Função para configurar a variável DATABASE_URL se não estiver presente
function setupDatabaseUrlIfNeeded() {
  if (
    !process.env.DATABASE_URL &&
    process.env.DATABASE_URL_POSTGRES_PRISMA_URL
  ) {
    console.log(
      "DATABASE_URL não está definida. Usando DATABASE_URL_POSTGRES_PRISMA_URL como alternativa."
    );
    process.env.DATABASE_URL = process.env.DATABASE_URL_POSTGRES_PRISMA_URL;
    return true;
  } else if (
    !process.env.DATABASE_URL &&
    process.env.DATABASE_URL_POSTGRES_URL
  ) {
    console.log(
      "DATABASE_URL não está definida. Usando DATABASE_URL_POSTGRES_URL como alternativa."
    );
    process.env.DATABASE_URL = process.env.DATABASE_URL_POSTGRES_URL;
    return true;
  } else if (!process.env.DATABASE_URL) {
    console.error(
      "Nenhuma variável de ambiente de conexão com banco de dados disponível!"
    );
    return false;
  }

  console.log("DATABASE_URL já está configurada corretamente.");
  return true;
}

// Função para inicializar o banco de dados
async function initializeDatabase() {
  console.log("Iniciando setup do Prisma...");

  // Primeiro, configurar a variável DATABASE_URL se necessário
  if (!setupDatabaseUrlIfNeeded()) {
    throw new Error(
      "Não foi possível configurar a conexão com o banco de dados!"
    );
  }

  try {
    // Verificar se precisamos executar as migrações ou criar diretamente as tabelas
    if (isVercelProduction()) {
      console.log("Executando no ambiente de produção do Vercel");
      console.log("Criando tabelas diretamente usando Prisma...");

      // No Vercel, vamos criar a tabela diretamente usando o Prisma Client
      // Este método é mais compatível com ambientes serverless
      const prisma = new PrismaClient();

      try {
        // Tentar acessar algum registro para verificar se a tabela existe
        await prisma.$queryRaw`SELECT 1 FROM "Session" LIMIT 1`;
        console.log("Tabela de sessão já existe!");
      } catch (error) {
        console.log("Tabela de sessão não encontrada, gerando esquema...");

        // Se a tabela não existir, podemos usar o Prisma Client para criar o esquema
        try {
          // Em produção, vamos gerar o SQL diretamente
          console.log(
            "Gerando o esquema do banco de dados diretamente via SQL..."
          );

          await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "Session" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "shop" TEXT NOT NULL,
              "state" TEXT NOT NULL,
              "isOnline" BOOLEAN NOT NULL DEFAULT false,
              "scope" TEXT,
              "expires" TIMESTAMP,
              "accessToken" TEXT NOT NULL,
              "userId" BIGINT,
              "firstName" TEXT,
              "lastName" TEXT,
              "email" TEXT,
              "accountOwner" BOOLEAN NOT NULL DEFAULT false,
              "locale" TEXT,
              "collaborator" BOOLEAN DEFAULT false,
              "emailVerified" BOOLEAN DEFAULT false
            );
          `);

          console.log("Tabela de sessão criada com sucesso!");
        } catch (sqlError) {
          console.error("Erro ao criar tabela diretamente:", sqlError);
          throw sqlError;
        }
      }

      await prisma.$disconnect();
    } else {
      // Em ambiente local, usamos o método normal de migrações
      console.log("Ambiente de desenvolvimento detectado");
      console.log("Executando migrações do Prisma...");

      // Executar as migrações normalmente
      try {
        execSync("npx prisma migrate deploy", { stdio: "inherit" });
        console.log("Migrações executadas com sucesso!");
      } catch (migrateError) {
        console.error("Erro ao executar migrações:", migrateError);
        throw migrateError;
      }
    }

    console.log("Setup do Prisma concluído com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro durante o setup do Prisma:", error);
    return false;
  }
}

// Se este arquivo for executado diretamente (não importado)
if (process.argv[1] === import.meta.url) {
  initializeDatabase()
    .then((success) => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error("Erro fatal:", error);
      process.exit(1);
    });
}

export default initializeDatabase;
