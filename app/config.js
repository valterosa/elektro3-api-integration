/**
 * Arquivo centralizado para gerenciar variáveis de ambiente e configurações
 * Este arquivo facilita a manutenção das configurações em um único local
 */

import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Debug: Mostrar variáveis de ambiente
console.log(
  "DEBUG config.js - ELEKTRO3_API_URL:",
  process.env.ELEKTRO3_API_URL
);
console.log(
  "DEBUG config.js - ELEKTRO3_CLIENT_ID:",
  process.env.ELEKTRO3_CLIENT_ID
);
console.log("DEBUG config.js - SHOPIFY_SHOP:", process.env.SHOPIFY_SHOP);

// Configurações da API Elektro3
export const ELEKTRO3_CONFIG = {
  API_URL: process.env.ELEKTRO3_API_URL || "https://api.elektro3.com",
  CLIENT_ID: process.env.ELEKTRO3_CLIENT_ID,
  SECRET_KEY: process.env.ELEKTRO3_SECRET_KEY,
  USERNAME: process.env.ELEKTRO3_USERNAME,
  PASSWORD: process.env.ELEKTRO3_PASSWORD,
};

// Configurações do Shopify
export const SHOPIFY_CONFIG = {
  SHOP: process.env.SHOPIFY_SHOP,
  API_KEY: process.env.SHOPIFY_API_KEY,
  API_SECRET: process.env.SHOPIFY_API_SECRET || "",
  ADMIN_API_ACCESS_TOKEN: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
  API_VERSION: "2025-04", // Versão atualizada e centralizada da API
  SCOPES: process.env.SCOPES?.split(",") || ["write_products"],
  APP_URL: process.env.SHOPIFY_APP_URL || "",
};

/**
 * Verifica se todas as configurações necessárias estão presentes
 * @returns {Object} Objeto com status da verificação
 */
export function checkRequiredConfig() {
  const missing = {
    elektro3: [],
    shopify: [],
  };

  // Verificar configurações Elektro3
  if (!ELEKTRO3_CONFIG.API_URL) missing.elektro3.push("ELEKTRO3_API_URL");
  if (!ELEKTRO3_CONFIG.CLIENT_ID) missing.elektro3.push("ELEKTRO3_CLIENT_ID");
  if (!ELEKTRO3_CONFIG.SECRET_KEY) missing.elektro3.push("ELEKTRO3_SECRET_KEY");
  if (!ELEKTRO3_CONFIG.USERNAME) missing.elektro3.push("ELEKTRO3_USERNAME");
  if (!ELEKTRO3_CONFIG.PASSWORD) missing.elektro3.push("ELEKTRO3_PASSWORD");

  // Verificar configurações Shopify
  if (!SHOPIFY_CONFIG.SHOP) missing.shopify.push("SHOPIFY_SHOP");
  if (!SHOPIFY_CONFIG.API_KEY) missing.shopify.push("SHOPIFY_API_KEY");
  if (!SHOPIFY_CONFIG.API_SECRET) missing.shopify.push("SHOPIFY_API_SECRET");
  if (!SHOPIFY_CONFIG.ADMIN_API_ACCESS_TOKEN)
    missing.shopify.push("SHOPIFY_ADMIN_API_ACCESS_TOKEN");

  const allConfigPresent =
    missing.elektro3.length === 0 && missing.shopify.length === 0;

  return {
    allConfigPresent,
    missing,
  };
}

// Log de configuração ao iniciar o aplicativo
console.log("Configurações carregadas:");
console.log("Elektro3 API URL:", ELEKTRO3_CONFIG.API_URL);
console.log("Elektro3 credentials configured:", {
  hasClientId: !!ELEKTRO3_CONFIG.CLIENT_ID,
  hasSecretKey: !!ELEKTRO3_CONFIG.SECRET_KEY,
  hasUsername: !!ELEKTRO3_CONFIG.USERNAME,
  hasPassword: !!ELEKTRO3_CONFIG.PASSWORD,
});
console.log("Shopify API version:", SHOPIFY_CONFIG.API_VERSION);
