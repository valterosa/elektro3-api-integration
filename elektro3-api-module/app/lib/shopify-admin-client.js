// Este arquivo cria um cliente Shopify que usa diretamente o Admin API Access Token
// em vez de depender do fluxo OAuth para autenticação

export function createShopifyAdminClient() {
  const shop = process.env.SHOPIFY_SHOP || "electro-malho.myshopify.com";
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  const apiVersion = "2025-01"; // Use a versão mais recente da API

  // Função para fazer requisições GraphQL para a Admin API
  async function graphql(query, variables = {}) {
    const url = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro na requisição GraphQL: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  }

  // Função para fazer requisições REST para a Admin API
  async function rest(endpoint, method = "GET", data = null) {
    const url = `https://${shop}/admin/api/${apiVersion}/${endpoint}`;

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    };

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Erro na requisição REST: ${response.status} ${errorText}`,
      );
    }

    return await response.json();
  }

  return {
    graphql,
    rest,
    shop,
  };
}

// Cria uma instância do cliente para uso global
export const shopifyAdminClient = createShopifyAdminClient();
