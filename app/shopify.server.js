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
console.log(
  "ENV VARS:",
  Object.keys(process.env).filter((key) => key.includes("SHOPIFY"))
);
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

// Verificação especial para o segredo da API - tentar diferentes formatos
function getApiSecretKey() {
  const possibleKeys = [
    "SHOPIFY_API_SECRET",
    "SHOPIFY_API_SECRET_KEY",
    "SHOPIFY_SECRET",
    "SHOPIFY_SECRET_KEY",
  ];

  // Criar um mapa para logging
  const valueMap = {};

  // Tentar todas as possíveis chaves
  for (const key of possibleKeys) {
    const value = process.env[key];
    valueMap[key] = value
      ? `***${value.substring(value.length - 4)}`
      : "undefined";

    if (value) {
      console.log(
        `Usando ${key} como API Secret Key: ***${value.substring(value.length - 4)}`
      );
      return value;
    }
  }

  // Logar os valores disponíveis para diagnóstico
  console.log("Tentativas de API Secret Key:", valueMap);

  // Em modo de produção, definir explicitamente o valor
  if (process.env.NODE_ENV === "production") {
    // Configurar diretamente o valor se estivermos no Vercel
    const hardcodedApiSecret = "ecb1f187b652f4b491595ce23cc5405c";
    console.log(
      "Modo de produção detectado. Usando API Secret Key hard-coded:",
      hardcodedApiSecret
        ? `***${hardcodedApiSecret.substring(hardcodedApiSecret.length - 4)}`
        : "undefined"
    );
    return hardcodedApiSecret;
  }

  // Para desenvolvimento, usar valor padrão
  console.log(
    "Usando valor padrão para API Secret Key em ambiente de desenvolvimento"
  );
  return DEFAULT_DEV_VALUES.apiSecretKey;
}

// Obter explicitamente a API Secret Key para garantir acesso
const apiSecretKey = getApiSecretKey();
console.log(
  "Final API Secret Key:",
  apiSecretKey
    ? `***${apiSecretKey.substring(apiSecretKey.length - 4)}`
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
  distribution: AppDistribution.AppStore, // Alterado de Custom para AppStore para aparecer no painel
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  isEmbeddedApp: true,
  hooks: {
    // Hook para depuração que será executado após a autenticação
    afterAuth: async ({ session, admin, resp }) => {
      console.log("Autenticação bem-sucedida para a loja:", session.shop);
      return resp;
    },
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const login = shopify.login;
