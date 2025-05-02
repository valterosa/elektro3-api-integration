/**
 * Gerenciador de webhooks do Shopify
 */
import { authenticate } from "../shopify.server";

/**
 * Busca todos os webhooks registrados na loja
 * @returns {Promise<Array>} Lista de webhooks
 */
export async function listWebhooks() {
  try {
    const { admin } = await authenticate.admin();

    const response = await admin.graphql(`
      query {
        webhookSubscriptions(first: 100) {
          edges {
            node {
              id
              topic
              endpoint {
                __typename
                ... on WebhookHttpEndpoint {
                  callbackUrl
                }
              }
            }
          }
        }
      }
    `);

    return response.data.webhookSubscriptions.edges.map((edge) => edge.node);
  } catch (error) {
    console.error("Erro ao listar webhooks:", error);
    return [];
  }
}

/**
 * Cria uma nova inscrição de webhook
 * @param {string} topic O tópico do webhook (ex: PRODUCTS_CREATE)
 * @param {string} callbackUrl URL que receberá as notificações
 * @returns {Promise<Object>} Resultado da operação
 */
export async function createWebhookSubscription(topic, callbackUrl) {
  try {
    const { admin } = await authenticate.admin();

    return await admin.graphql(`
      mutation {
        webhookSubscriptionCreate(
          topic: ${topic}
          webhookSubscription: {
            callbackUrl: "${callbackUrl}"
            format: JSON
          }
        ) {
          webhookSubscription {
            id
            topic
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
    `);
  } catch (error) {
    console.error("Erro ao criar webhook:", error);
    throw error;
  }
}

/**
 * Remove uma inscrição de webhook
 * @param {string} id ID do webhook a ser removido
 * @returns {Promise<Object>} Resultado da operação
 */
export async function deleteWebhookSubscription(id) {
  try {
    const { admin } = await authenticate.admin();

    return await admin.graphql(`
      mutation {
        webhookSubscriptionDelete(id: "${id}") {
          deletedWebhookSubscriptionId
          userErrors {
            field
            message
          }
        }
      }
    `);
  } catch (error) {
    console.error("Erro ao remover webhook:", error);
    throw error;
  }
}
