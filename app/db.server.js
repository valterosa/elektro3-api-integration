import { PrismaClient } from "@prisma/client";

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

  console.log("DATABASE_URL configurada corretamente para Prisma");
  return true;
}

// Configurar DATABASE_URL na inicialização
setupDatabaseUrlIfNeeded();

let prisma;

// Em ambientes ESM, precisamos usar uma abordagem diferente para a variável global
if (process.env.NODE_ENV === "production") {
  // Em produção, sempre criar uma nova instância
  console.log("Inicializando PrismaClient em modo de produção");
  try {
    prisma = new PrismaClient({
      // Adicionar logs em produção para diagnosticar problemas
      log: ["error", "warn"],
      errorFormat: "pretty",
    });
    console.log("PrismaClient inicializado com sucesso");
  } catch (error) {
    console.error("Erro ao inicializar PrismaClient:", error);
    throw error;
  }
} else {
  // Em desenvolvimento, reutilizar a instância para evitar múltiplas conexões
  console.log("Inicializando PrismaClient em modo de desenvolvimento");
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.prisma;
}

export default prisma;
