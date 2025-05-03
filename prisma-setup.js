// prisma-setup.js
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

// Função para verificar se estamos no ambiente Vercel em produção
function isVercelProduction() {
  return process.env.VERCEL === "1" && process.env.NODE_ENV === "production";
}

// Função para configurar a variável DATABASE_URL se não estiver presente
function setupDatabaseUrlIfNeeded() {
  // Verificar se DATABASE_URL já está definida
  if (process.env.DATABASE_URL) {
    console.log(
      "DATABASE_URL já está configurada:",
      process.env.DATABASE_URL.substring(0, 35) + "..."
    );
    return true;
  }

  // Opções prioritárias para URL de banco de dados
  const possibleDbUrls = [
    "DATABASE_URL_POSTGRES_PRISMA_URL",
    "DATABASE_URL_POSTGRES_URL",
    "DATABASE_URL_POSTGRES_URL_NON_POOLING",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
  ];

  console.log("DATABASE_URL não está definida. Buscando alternativas:");

  // Tentar cada possível variável
  for (const dbUrlVar of possibleDbUrls) {
    if (process.env[dbUrlVar]) {
      console.log(
        `Usando ${dbUrlVar} como DATABASE_URL:`,
        process.env[dbUrlVar].substring(0, 35) + "..."
      );
      process.env.DATABASE_URL = process.env[dbUrlVar];
      return true;
    }
  }

  // Se ainda não encontrou, construir a URL a partir de componentes individuais
  if (
    process.env.POSTGRES_USER &&
    process.env.POSTGRES_PASSWORD &&
    process.env.POSTGRES_HOST &&
    process.env.POSTGRES_DATABASE
  ) {
    const url = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:5432/${process.env.POSTGRES_DATABASE}?sslmode=require`;
    console.log(
      "Construindo DATABASE_URL a partir de componentes:",
      url.substring(0, 35) + "..."
    );
    process.env.DATABASE_URL = url;
    return true;
  }

  // Último recurso: tentar construir com variáveis prefixadas
  if (
    process.env.DATABASE_URL_POSTGRES_USER &&
    process.env.DATABASE_URL_POSTGRES_PASSWORD &&
    process.env.DATABASE_URL_POSTGRES_HOST &&
    process.env.DATABASE_URL_POSTGRES_DATABASE
  ) {
    const url = `postgres://${process.env.DATABASE_URL_POSTGRES_USER}:${process.env.DATABASE_URL_POSTGRES_PASSWORD}@${process.env.DATABASE_URL_POSTGRES_HOST}:5432/${process.env.DATABASE_URL_POSTGRES_DATABASE}?sslmode=require`;
    console.log(
      "Construindo DATABASE_URL a partir de componentes prefixados:",
      url.substring(0, 35) + "..."
    );
    process.env.DATABASE_URL = url;
    return true;
  }

  console.error(
    "Não foi possível encontrar nenhuma variável de conexão com banco de dados!"
  );
  console.error(
    "Variáveis de ambiente disponíveis:",
    Object.keys(process.env).filter(
      (key) => key.includes("DATABASE") || key.includes("POSTGRES")
    )
  );
  return false;
}

// Função para inicializar o banco de dados
async function initializeDatabase() {
  console.log(
    "Iniciando setup do Prisma no ambiente:",
    process.env.NODE_ENV || "desconhecido"
  );

  // Primeiro, configurar a variável DATABASE_URL se necessário
  if (!setupDatabaseUrlIfNeeded()) {
    throw new Error(
      "Não foi possível configurar a conexão com o banco de dados!"
    );
  }

  try {
    console.log("Tentando conectar ao banco de dados...");
    const prisma = new PrismaClient();

    try {
      // Testar a conexão com o banco de dados
      await prisma.$queryRaw`SELECT 1 AS "connection_test"`;
      console.log("Conexão com o banco de dados estabelecida com sucesso!");
    } catch (connectionError) {
      console.error("Erro ao conectar ao banco de dados:", connectionError);
      throw new Error(
        "Falha na conexão com o banco de dados: " + connectionError.message
      );
    }

    // Verificar se a tabela Session existe
    try {
      console.log("Verificando se a tabela Session existe...");
      await prisma.$queryRaw`SELECT COUNT(*) FROM "Session" LIMIT 1`;
      console.log("Tabela Session já existe no banco de dados!");
    } catch (tableError) {
      console.log("Tabela Session não encontrada, tentando criar...");

      try {
        console.log("Criando tabela Session via SQL...");

        // Script completo para criar a tabela Session
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
          
          -- Adicionar índice na coluna shop para melhorar performance de consultas
          CREATE INDEX IF NOT EXISTS "Session_shop_idx" ON "Session"("shop");
        `);

        console.log("Tabela Session criada com sucesso!");
      } catch (createError) {
        console.error("Erro ao criar tabela Session:", createError);
        throw createError;
      }
    }

    // Confirmar que a tabela foi criada tentando inserir um registro de teste
    try {
      const testSessionId = `test-session-${Date.now()}`;
      console.log("Inserindo sessão de teste para verificar a tabela...");

      await prisma.session.upsert({
        where: { id: testSessionId },
        update: {},
        create: {
          id: testSessionId,
          shop: "teste-shop.myshopify.com",
          state: "teste-state",
          accessToken: "teste-token",
          isOnline: false,
        },
      });

      console.log("Sessão de teste inserida com sucesso!");

      // Limpar a sessão de teste
      await prisma.session.delete({ where: { id: testSessionId } });
      console.log("Sessão de teste removida após verificação.");
    } catch (testError) {
      console.error("Erro ao testar a tabela Session:", testError);
      // Não vamos falhar aqui, pois a tabela pode estar criada corretamente mesmo assim
      console.log("Continuando mesmo com erro no teste de inserção.");
    }

    await prisma.$disconnect();
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
