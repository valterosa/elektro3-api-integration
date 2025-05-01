// Script para testar a conexão com as APIs (Elektro3 e Shopify)
require("dotenv").config();
const fetch = require("node-fetch");

// Configurações da API Elektro3
const ELEKTRO3_API_URL = process.env.ELEKTRO3_API_URL;
const ELEKTRO3_CLIENT_ID = process.env.ELEKTRO3_CLIENT_ID;
const ELEKTRO3_SECRET_KEY = process.env.ELEKTRO3_SECRET_KEY;
const ELEKTRO3_USERNAME = process.env.ELEKTRO3_USERNAME;
const ELEKTRO3_PASSWORD = process.env.ELEKTRO3_PASSWORD;

// Configurações do Shopify
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

/**
 * Testar conexão com a API Elektro3
 */
async function testElektro3Connection() {
  console.log("---------- TESTE DE CONEXÃO COM API ELEKTRO3 ----------");
  console.log("URL da API:", ELEKTRO3_API_URL);
  console.log("Credenciais configuradas:");
  console.log("- Client ID:", ELEKTRO3_CLIENT_ID);
  console.log("- Username:", ELEKTRO3_USERNAME);

  // Verificando se o domínio está acessível
  try {
    console.log("\nVerificando se o domínio está acessível...");
    const pingResponse = await fetch(ELEKTRO3_API_URL);
    console.log("Status do ping:", pingResponse.status);
    console.log("Resposta do ping:", await pingResponse.text());
  } catch (error) {
    console.log("Erro ao fazer ping no domínio da API:", error.message);
    if (error.code === "ENOTFOUND") {
      console.log(
        "O domínio não foi encontrado. Verifique se a URL está correta."
      );
    }
  }

  // Tentativas de autenticação com diferentes endpoints e formatos
  const authEndpoints = [
    "/api/login",
    "/login",
    "/auth",
    "/api/auth",
    "/api/v1/auth",
    "/oauth/token",
  ];

  console.log("\nTestando vários endpoints de autenticação...");

  for (const endpoint of authEndpoints) {
    try {
      console.log(`\nTentando endpoint: ${ELEKTRO3_API_URL}${endpoint}`);

      // Formato 1: clientId e secretKey
      const authPayload1 = {
        clientId: ELEKTRO3_CLIENT_ID,
        secretKey: ELEKTRO3_SECRET_KEY,
        username: ELEKTRO3_USERNAME,
        password: ELEKTRO3_PASSWORD,
      };

      // Formato 2: client_id e client_secret
      const authPayload2 = {
        client_id: ELEKTRO3_CLIENT_ID,
        client_secret: ELEKTRO3_SECRET_KEY,
        username: ELEKTRO3_USERNAME,
        password: ELEKTRO3_PASSWORD,
      };

      // Formato 3: apenas username e password
      const authPayload3 = {
        username: ELEKTRO3_USERNAME,
        password: ELEKTRO3_PASSWORD,
      };

      // Formato 4: identifier e password
      const authPayload4 = {
        identifier: ELEKTRO3_USERNAME,
        password: ELEKTRO3_PASSWORD,
      };

      const payloads = [authPayload1, authPayload2, authPayload3, authPayload4];

      for (let i = 0; i < payloads.length; i++) {
        try {
          console.log(
            `  Tentando formato de payload ${i + 1}:`,
            JSON.stringify(payloads[i])
          );

          const authResponse = await fetch(`${ELEKTRO3_API_URL}${endpoint}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payloads[i]),
          });

          const status = authResponse.status;

          try {
            const responseBody = await authResponse.text();
            console.log(`  Resposta (${status}):`, responseBody);

            if (status >= 200 && status < 300) {
              console.log(
                "\n✅ SUCESSO! Conexão com a API Elektro3 funcionou!"
              );
              console.log(
                "Endpoint de autenticação:",
                `${ELEKTRO3_API_URL}${endpoint}`
              );
              console.log("Formato de payload:", JSON.stringify(payloads[i]));
              return {
                success: true,
                endpoint,
                payload: payloads[i],
                response: responseBody,
              };
            }
          } catch (e) {
            console.log(`  Erro ao processar resposta:`, e.message);
          }
        } catch (e) {
          console.log(`  Erro ao tentar formato ${i + 1}:`, e.message);
        }
      }
    } catch (error) {
      console.log(`Erro ao tentar endpoint ${endpoint}:`, error.message);
    }
  }

  console.log(
    "\n❌ FALHA: Não foi possível conectar à API Elektro3 com as credenciais fornecidas"
  );
  return { success: false };
}

/**
 * Testar conexão com a API Shopify
 */
async function testShopifyConnection() {
  console.log("\n---------- TESTE DE CONEXÃO COM API SHOPIFY ----------");
  console.log("Loja Shopify:", SHOPIFY_SHOP);
  console.log(
    "Token de acesso configurado:",
    `${SHOPIFY_ADMIN_API_ACCESS_TOKEN.substring(0, 5)}...`
  );

  try {
    console.log("\nTestando acesso à API Shopify...");

    // Tentar buscar informações da loja
    const shopResponse = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2023-04/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        },
      }
    );

    const status = shopResponse.status;
    console.log("Status da resposta:", status);

    const responseBody = await shopResponse.text();
    console.log("Resposta:", responseBody);

    if (status === 200) {
      console.log("\n✅ SUCESSO! Conexão com a API Shopify funcionou!");
      return { success: true, response: responseBody };
    } else {
      console.log("\n❌ FALHA: Erro ao conectar à API Shopify");
      return { success: false, error: responseBody };
    }
  } catch (error) {
    console.log("Erro ao conectar à API Shopify:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log(
      "================================================================="
    );
    console.log("TESTE DE CONEXÃO COM AS APIS (ELEKTRO3 E SHOPIFY)");
    console.log(
      "=================================================================\n"
    );

    // Testar conexão com a API Elektro3
    const elektro3Result = await testElektro3Connection();

    // Testar conexão com a API Shopify
    const shopifyResult = await testShopifyConnection();

    console.log(
      "\n================================================================="
    );
    console.log("RESULTADO DOS TESTES");
    console.log(
      "================================================================="
    );
    console.log(
      "Elektro3 API:",
      elektro3Result.success ? "CONECTADO ✅" : "FALHA ❌"
    );
    console.log(
      "Shopify API:",
      shopifyResult.success ? "CONECTADO ✅" : "FALHA ❌"
    );
    console.log(
      "=================================================================\n"
    );

    if (elektro3Result.success && shopifyResult.success) {
      console.log(
        "Ambas as APIs estão funcionando! Você pode prosseguir com a importação de produtos."
      );
    } else {
      console.log(
        "Há problemas de conexão com uma ou ambas as APIs. Corrija os problemas antes de continuar."
      );
    }

    return {
      elektro3: elektro3Result,
      shopify: shopifyResult,
    };
  } catch (error) {
    console.error("Erro durante os testes de conexão:", error);
  }
}

// Executar os testes
main();
