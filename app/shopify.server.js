import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import * as process from "process";

// Log para depuração das variáveis de ambiente
console.log("Checking environment variables availability:");
console.log("SHOPIFY_API_KEY present:", !!process.env.SHOPIFY_API_KEY);
console.log("SHOPIFY_API_SECRET present:", !!process.env.SHOPIFY_API_SECRET);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Configurações padrão para desenvolvimento local
const DEFAULT_DEV_VALUES = {
  apiKey: "dummy_api_key_for_dev",
  apiSecretKey: "dummy_api_secret_for_dev",
  scopes: "write_products,read_products",
  appUrl: "http://localhost:3000",
};

// Função para obter valores seguros das variáveis de ambiente
// Usa valores padrão para desenvolvimento se as variáveis não estiverem definidas
function getEnvVar(name, defaultValue = "") {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "development") {
    console.warn(
      `⚠️ Aviso: ${name} não está definido no ambiente. Usando valor padrão para desenvolvimento.`
    );
    return defaultValue;
  }
  return value || "";
}

// Obter explicitamente a API Secret Key para garantir acesso
const apiSecretKey =
  process.env.SHOPIFY_API_SECRET || DEFAULT_DEV_VALUES.apiSecretKey;
console.log(
  "Using API Secret Key:",
  apiSecretKey
    ? "***" + apiSecretKey.substring(apiSecretKey.length - 4)
    : "undefined"
);

// Inicializar a API Shopify com tratamento seguro de variáveis de ambiente
const shopify = shopifyApp({
  apiKey: getEnvVar("SHOPIFY_API_KEY", DEFAULT_DEV_VALUES.apiKey),
  apiSecretKey: apiSecretKey, // Usar a variável explícita
  apiVersion: ApiVersion.January25,
  scopes: getEnvVar("SCOPES", DEFAULT_DEV_VALUES.scopes).split(","),
  appUrl: getEnvVar("SHOPIFY_APP_URL", DEFAULT_DEV_VALUES.appUrl),
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.Custom,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  isEmbeddedApp: true,
});

export default shopify;
export const authenticate = shopify.authenticate;
export const login = shopify.login;
