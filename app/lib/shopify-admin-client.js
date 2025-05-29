// Este arquivo cria um cliente Shopify que usa diretamente o Admin API Access Token
// para custom apps criadas no Shopify Admin

export function createShopifyAdminClient() {
  const shop = process.env.SHOPIFY_SHOP || "electro-malho.myshopify.com";
  const accessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;
  const apiVersion = "2025-04"; // Atualizado para a versão mais recente da API

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

    const jsonResponse = await response.json();

    // Verificar se a resposta contém erros
    if (jsonResponse.errors) {
      const errorMessage = jsonResponse.errors.map((e) => e.message).join(", ");
      throw new Error(`Erro GraphQL: ${errorMessage}`);
    }

    return jsonResponse;
  }

  // Função para subscrever webhooks usando GraphQL
  async function subscribeWebhook(topic, callbackUrl) {
    const mutation = `
      mutation webhookSubscriptionCreate($topic: WebhookSubscriptionTopic!, $webhookSubscription: WebhookSubscriptionInput!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: $webhookSubscription) {
          webhookSubscription {
            id
            endpoint {
              __typename
              ... on WebhookHttpEndpoint {
                callbackUrl
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const variables = {
      topic,
      webhookSubscription: {
        callbackUrl,
        format: "JSON",
      },
    };

    return await graphql(mutation, variables);
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
    subscribeWebhook,
  };
}

// Cria uma instância do cliente para uso global
export const shopifyAdminClient = createShopifyAdminClient();
