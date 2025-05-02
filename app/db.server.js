import { PrismaClient } from "@prisma/client";

let prisma;

// Em ambientes ESM, precisamos usar uma abordagem diferente para a variável global
if (process.env.NODE_ENV === "production") {
  // Em produção, sempre criar uma nova instância
  prisma = new PrismaClient();
} else {
  // Em desenvolvimento, reutilizar a instância para evitar múltiplas conexões
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = global.prisma;
}

export default prisma;
