// Script para verificar se as variáveis de ambiente estão sendo carregadas corretamente

import dotenv from "dotenv";
dotenv.config();

console.log("========== VARIÁVEIS DE AMBIENTE ==========");
console.log("ELEKTRO3_API_URL:", process.env.ELEKTRO3_API_URL);
console.log("ELEKTRO3_CLIENT_ID:", process.env.ELEKTRO3_CLIENT_ID);
console.log(
  "ELEKTRO3_SECRET_KEY:",
  process.env.ELEKTRO3_SECRET_KEY ? "[CONFIGURADO]" : undefined
);
console.log("ELEKTRO3_USERNAME:", process.env.ELEKTRO3_USERNAME);
console.log(
  "ELEKTRO3_PASSWORD:",
  process.env.ELEKTRO3_PASSWORD ? "[CONFIGURADO]" : undefined
);

console.log("\nSHOPIFY_SHOP:", process.env.SHOPIFY_SHOP);
console.log("SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY);
console.log(
  "SHOPIFY_API_SECRET:",
  process.env.SHOPIFY_API_SECRET ? "[CONFIGURADO]" : undefined
);
console.log(
  "SHOPIFY_ADMIN_API_ACCESS_TOKEN:",
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN ? "[CONFIGURADO]" : undefined
);

console.log("\nNODE_ENV:", process.env.NODE_ENV);
