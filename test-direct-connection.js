/**
 * Script para testar a conexão com a API da Elektro3 e a API do Shopify
 * Útil para validar as credenciais e a conectividade antes de executar a aplicação completa
 */

// Carregar as variáveis de ambiente do arquivo .env
import dotenv from "dotenv";
dotenv.config();

// Credenciais da API Elektro3 carregadas diretamente
const ELEKTRO3_API_URL =
  process.env.ELEKTRO3_API_URL || "https://api.elektro3.com";
const ELEKTRO3_CLIENT_ID = process.env.ELEKTRO3_CLIENT_ID;
const ELEKTRO3_SECRET_KEY = process.env.ELEKTRO3_SECRET_KEY;
const ELEKTRO3_USERNAME = process.env.ELEKTRO3_USERNAME;
const ELEKTRO3_PASSWORD = process.env.ELEKTRO3_PASSWORD;

// Credenciais do Shopify carregadas diretamente
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = "2025-04";

console.log("🔍 Iniciando teste de conexão com as APIs...\n");

// Exibir as configurações atuais (mascaradas para segurança)
console.log("Configurações Elektro3:");
console.log("  API URL:", ELEKTRO3_API_URL);
console.log(
  "  Credenciais configuradas:",
  !!ELEKTRO3_CLIENT_ID &&
    !!ELEKTRO3_SECRET_KEY &&
    !!ELEKTRO3_USERNAME &&
    !!ELEKTRO3_PASSWORD
);

console.log("\nConfigurações Shopify:");
console.log("  Loja:", SHOPIFY_SHOP);
console.log("  API Version:", SHOPIFY_API_VERSION);
console.log(
  "  Credenciais configuradas:",
  !!SHOPIFY_API_KEY && !!SHOPIFY_API_SECRET && !!SHOPIFY_ADMIN_API_ACCESS_TOKEN
);

// Função para autenticar na API da Elektro3
async function authenticateElektro3() {
  try {
    // Verificar se todas as credenciais estão configuradas
    if (
      !ELEKTRO3_CLIENT_ID ||
      !ELEKTRO3_SECRET_KEY ||
      !ELEKTRO3_USERNAME ||
      !ELEKTRO3_PASSWORD
    ) {
      throw new Error(
        "Missing Elektro3 API credentials. Please check your environment variables."
      );
    }

    console.log(
      "\nAutenticando na API Elektro3 usando endpoint /oauth/token..."
    );

    // Formato correto conforme documentação (usando grant_type)
    const authPayload = {
      grant_type: "password",
      client_id: ELEKTRO3_CLIENT_ID,
      client_secret: ELEKTRO3_SECRET_KEY,
      username: ELEKTRO3_USERNAME,
      password: ELEKTRO3_PASSWORD,
    };

    const response = await fetch(`${ELEKTRO3_API_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(authPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Erro ao autenticar na API Elektro3:", error);
    throw error;
  }
}

// Função para testar conexão com o Shopify
async function testShopifyConnection() {
  try {
    if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
      throw new Error("Credenciais do Shopify não configuradas");
    }

    const shopResponse = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        },
      }
    );

    if (!shopResponse.ok) {
      const responseText = await shopResponse.text();
      throw new Error(`Erro: ${shopResponse.status} - ${responseText}`);
    }

    return await shopResponse.json();
  } catch (error) {
    console.error("Erro ao conectar com o Shopify:", error);
    throw error;
  }
}

// Função principal para testar as conexões
async function runConnectionTests() {
  const results = {
    elektro3: { success: false, message: "" },
    shopify: { success: false, message: "" },
  };

  try {
    console.log("\n🔄 Testando conexão com ambas as APIs...");

    // Testar conexão com Elektro3
    try {
      const token = await authenticateElektro3();
      results.elektro3.success = true;
      results.elektro3.message =
        "Conexão com a API Elektro3 estabelecida com sucesso";
      results.elektro3.token = token.substring(0, 10) + "...";
    } catch (error) {
      results.elektro3.success = false;
      results.elektro3.message = `Erro ao conectar à API Elektro3: ${error.message}`;
    }

    // Testar conexão com Shopify
    try {
      const shopData = await testShopifyConnection();
      results.shopify.success = true;
      results.shopify.message =
        "Conexão com a API Shopify estabelecida com sucesso";
      results.shopify.shopName = shopData.shop?.name;
    } catch (error) {
      results.shopify.success = false;
      results.shopify.message = `Erro ao conectar à API Shopify: ${error.message}`;
    }

    console.log("\n📊 Resultados do teste:");

    // Mostrar resultados para Elektro3
    console.log("\nElektro3 API:");
    if (results.elektro3.success) {
      console.log("  ✅ CONECTADO");
      console.log("  📝 " + results.elektro3.message);
      if (results.elektro3.token) {
        console.log("  🔑 Token parcial: " + results.elektro3.token);
      }
    } else {
      console.log("  ❌ FALHA");
      console.log("  ❗ " + results.elektro3.message);
    }

    // Mostrar resultados para Shopify
    console.log("\nShopify API:");
    if (results.shopify.success) {
      console.log("  ✅ CONECTADO");
      console.log("  📝 " + results.shopify.message);
      if (results.shopify.shopName) {
        console.log("  🏪 Nome da loja: " + results.shopify.shopName);
      }
    } else {
      console.log("  ❌ FALHA");
      console.log("  ❗ " + results.shopify.message);
    }

    console.log("\n📋 Resumo dos testes:");
    if (results.elektro3.success && results.shopify.success) {
      console.log("✅ Ambas as conexões estão funcionando corretamente!");
    } else if (!results.elektro3.success && !results.shopify.success) {
      console.log(
        "❌ Ambas as conexões falharam. Verifique suas credenciais e configurações."
      );
    } else {
      console.log(
        "⚠️ Uma das conexões falhou. Revise as configurações específicas."
      );
    }
  } catch (error) {
    console.error("\n❌ Erro ao executar testes de conexão:", error);
  }
}

// Executar os testes
runConnectionTests();
