// Este arquivo contém funções utilitárias para gerenciar webhooks usando o GraphQL Admin API

import { shopifyAdminClient } from "./shopify-admin-client";

/**
 * Lista todos os webhooks ativos na loja
 * @returns {Promise<Array>} Lista de webhooks
 */
export async function listWebhooks() {
  const query = `
    query getWebhookSubscriptions {
      webhookSubscriptions(first: 25) {
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
            format
            createdAt
          }
        }
      }
    }
  `;

  const response = await shopifyAdminClient.graphql(query);
  return response.data.webhookSubscriptions.edges.map((edge) => edge.node);
}

/**
 * Cria uma nova subscrição de webhook
 * @param {string} topic - Tópico do webhook (ex: PRODUCTS_CREATE)
 * @param {string} callbackUrl - URL para receber as notificações do webhook
 * @returns {Promise<Object>} Resultado da criação do webhook
 */
export async function createWebhookSubscription(topic, callbackUrl) {
  return await shopifyAdminClient.subscribeWebhook(topic, callbackUrl);
}

/**
 * Remove uma subscrição de webhook
 * @param {string} webhookId - ID do webhook a ser removido
 * @returns {Promise<Object>} Resultado da remoção
 */
export async function deleteWebhookSubscription(webhookId) {
  const mutation = `
    mutation webhookSubscriptionDelete($id: ID!) {
      webhookSubscriptionDelete(id: $id) {
        deletedWebhookSubscriptionId
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    id: webhookId,
  };

  return await shopifyAdminClient.graphql(mutation, variables);
}

/**
 * Configura webhooks para tópicos específicos
 * @param {Array<string>} topics - Lista de tópicos para subscrever
 * @param {string} baseUrl - URL base para os callbacks
 */
export async function setupWebhooks(topics, baseUrl) {
  if (!baseUrl.endsWith("/")) {
    baseUrl += "/";
  }

  const results = [];

  for (const topic of topics) {
    // Converter o tópico para o formato de URL (ex: PRODUCTS_CREATE => webhooks/products/create)
    const topicPath = topic.toLowerCase().replace("_", "/");
    const callbackUrl = `${baseUrl}webhooks/${topicPath}`;

    try {
      const result = await createWebhookSubscription(topic, callbackUrl);
      results.push({
        topic,
        success: !result.data.webhookSubscriptionCreate.userErrors.length,
        errors: result.data.webhookSubscriptionCreate.userErrors,
        webhookId:
          result.data.webhookSubscriptionCreate.webhookSubscription?.id,
      });
    } catch (error) {
      results.push({
        topic,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}
