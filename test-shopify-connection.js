// Script para testar a conexão com o Shopify
require("dotenv").config();
const fetch = require("node-fetch");

// Configurações do Shopify
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

/**
 * Testar conexão com a API Shopify
 */
async function testShopifyConnection() {
  console.log("---------- TESTE DE CONEXÃO COM API SHOPIFY ----------");
  console.log("Loja Shopify:", SHOPIFY_SHOP);
  console.log("Token de acesso:", SHOPIFY_ADMIN_API_ACCESS_TOKEN);

  try {
    console.log("\nTestando acesso à API Shopify (REST)...");

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
    console.log("Status da resposta REST:", status);

    const responseText = await shopResponse.text();
    console.log(
      "Resposta REST (primeiros 300 caracteres):",
      responseText.substring(0, 300)
    );

    if (shopResponse.ok) {
      try {
        const responseData = JSON.parse(responseText);
        console.log(
          "\n✅ SUCESSO! Conexão com a API REST do Shopify funcionou!"
        );
        console.log("Nome da loja:", responseData.shop?.name || "N/A");
        console.log("Email da loja:", responseData.shop?.email || "N/A");
      } catch (e) {
        console.log("Erro ao processar resposta JSON:", e.message);
      }
    } else {
      console.log("\n❌ FALHA: Erro ao conectar à API REST do Shopify");
    }

    // Testar também a API GraphQL
    console.log("\nTestando acesso à API Shopify (GraphQL)...");

    const graphqlQuery = `{
      shop {
        name
        email
      }
    }`;

    const graphqlResponse = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2023-04/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        },
        body: JSON.stringify({ query: graphqlQuery }),
      }
    );

    const graphqlStatus = graphqlResponse.status;
    console.log("Status da resposta GraphQL:", graphqlStatus);

    const graphqlResponseText = await graphqlResponse.text();
    console.log(
      "Resposta GraphQL (primeiros 300 caracteres):",
      graphqlResponseText.substring(0, 300)
    );

    if (graphqlResponse.ok) {
      try {
        const graphqlData = JSON.parse(graphqlResponseText);
        console.log(
          "\n✅ SUCESSO! Conexão com a API GraphQL do Shopify funcionou!"
        );
        console.log(
          "Nome da loja (GraphQL):",
          graphqlData.data?.shop?.name || "N/A"
        );
        console.log(
          "Email da loja (GraphQL):",
          graphqlData.data?.shop?.email || "N/A"
        );
      } catch (e) {
        console.log("Erro ao processar resposta GraphQL JSON:", e.message);
      }
    } else {
      console.log("\n❌ FALHA: Erro ao conectar à API GraphQL do Shopify");
    }

    // Verificar se o token atual funciona
    if (!shopResponse.ok && !graphqlResponse.ok) {
      console.log(
        "\nAmbas as APIs REST e GraphQL falharam. Verificando formato do token..."
      );

      // Verificar o formato do token
      if (SHOPIFY_ADMIN_API_ACCESS_TOKEN.includes("-")) {
        console.log(
          "\nAviso: O token fornecido parece ser um token de API privada (formato com hífen)."
        );
        console.log(
          'Os tokens de API Admin modernos geralmente começam com "shpat_".'
        );
        console.log(
          "Sugestão: Gere um novo token de acesso no painel administrativo do Shopify."
        );
      } else if (SHOPIFY_ADMIN_API_ACCESS_TOKEN.startsWith("shpat_")) {
        console.log(
          '\nO formato do token parece correto (começa com "shpat_").'
        );
        console.log(
          "Porém, o token pode ter expirado ou não ter as permissões necessárias."
        );
      } else {
        console.log(
          "\nO formato do token não parece ser um token de acesso Admin API padrão."
        );
        console.log(
          "Recomendação: Verificar se o token foi gerado corretamente."
        );
      }
    }

    return {
      restSuccess: shopResponse.ok,
      graphqlSuccess: graphqlResponse.ok,
    };
  } catch (error) {
    console.error("Erro durante o teste de conexão:", error);
    return {
      restSuccess: false,
      graphqlSuccess: false,
      error: error.message,
    };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log(
    "================================================================="
  );
  console.log("TESTE DE CONEXÃO COM A API SHOPIFY");
  console.log(
    "================================================================="
  );

  const result = await testShopifyConnection();

  console.log(
    "\n================================================================="
  );
  console.log("RESUMO DO TESTE DE CONEXÃO");
  console.log(
    "================================================================="
  );
  console.log("API REST:", result.restSuccess ? "CONECTADO ✅" : "FALHA ❌");
  console.log(
    "API GraphQL:",
    result.graphqlSuccess ? "CONECTADO ✅" : "FALHA ❌"
  );
  console.log(
    "================================================================="
  );

  if (result.restSuccess || result.graphqlSuccess) {
    console.log(
      "\nBoas notícias! Pelo menos uma das APIs do Shopify está funcionando."
    );
    console.log("Você pode prosseguir com a importação de produtos.");
  } else {
    console.log(
      "\nNenhuma das APIs do Shopify está funcionando com o token fornecido."
    );
    console.log("Por favor, verifique o token de acesso e tente novamente.");
  }
}

// Executar o teste
main();
