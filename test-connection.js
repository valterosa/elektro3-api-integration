/**
 * Script para testar a conexão com a API da Elektro3 e a API do Shopify
 * Útil para validar as credenciais e a conectividade antes de executar a aplicação completa
 */

import { testConnections } from "./app/lib/elektro3-api.server.js";
import { directAdminClient } from "./app/lib/shopify-admin-client.js";
import { ELEKTRO3_CONFIG, SHOPIFY_CONFIG } from "./app/config.js";

console.log("🔍 Iniciando teste de conexão com as APIs...\n");

// Exibir as configurações atuais (mascaradas para segurança)
console.log("Configurações Elektro3:");
console.log("  API URL:", ELEKTRO3_CONFIG.API_URL);
console.log(
  "  Credenciais configuradas:",
  !!ELEKTRO3_CONFIG.CLIENT_ID &&
    !!ELEKTRO3_CONFIG.SECRET_KEY &&
    !!ELEKTRO3_CONFIG.USERNAME &&
    !!ELEKTRO3_CONFIG.PASSWORD
);

console.log("\nConfigurações Shopify:");
console.log("  Loja:", SHOPIFY_CONFIG.SHOP);
console.log("  API Version:", SHOPIFY_CONFIG.API_VERSION);
console.log(
  "  Credenciais configuradas:",
  !!SHOPIFY_CONFIG.API_KEY &&
    !!SHOPIFY_CONFIG.API_SECRET &&
    !!SHOPIFY_CONFIG.ADMIN_API_ACCESS_TOKEN
);

// Função principal para testar as conexões
async function runConnectionTests() {
  try {
    console.log("\n🔄 Testando conexão com ambas as APIs...");

    // Tentar o método de teste unificado
    const results = await testConnections();

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

    // Tentar acesso direto ao Shopify caso o teste principal falhe
    if (!results.shopify.success && directAdminClient) {
      console.log("\n🔄 Tentando método alternativo de conexão ao Shopify...");
      try {
        const shopData = await directAdminClient.rest("shop.json");
        console.log("  ✅ Conexão direta bem-sucedida!");
        console.log("  🏪 Nome da loja: " + shopData.shop.name);
      } catch (error) {
        console.log("  ❌ Falha na conexão direta:", error.message);
      }
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
