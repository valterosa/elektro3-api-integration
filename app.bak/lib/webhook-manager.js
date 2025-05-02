// Este arquivo contém funções utilitárias para gerenciar webhooks usando o GraphQL Admin API

import shopify from "../shopify.server";
import { shopifyAdminClient } from "./shopify-admin-client";
import { SHOPIFY_CONFIG } from "../config";

/**
 * Registra um webhook para a loja
 * @param {Object} params - Parâmetros para registro de webhook
 * @param {string} params.shop - Domínio da loja Shopify
 * @param {string} params.sessionToken - Token de sessão
 * @param {string} params.topic - Tópico do webhook
 * @param {string} params.address - URL de callback
 * @param {Array<string>} [params.includeFields] - Campos a serem incluídos na notificação
 * @returns {Promise<Object>} Resultado do registro
 */
export async function registerWebhook({
  shop,
  sessionToken,
  topic,
  address,
  includeFields,
}) {
  const admin = await shopifyAdminClient({ shop, sessionToken });

  const webhookSubscriptionCreate = `
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
      callbackUrl: address,
      format: "JSON",
    },
  };

  if (includeFields) {
    variables.webhookSubscription.includeFields = includeFields;
  }

  const response = await admin.graphql({
    data: {
      query: webhookSubscriptionCreate,
      variables,
    },
  });

  return response;
}

/**
 * Lista todos os webhooks registrados para a loja
 * @param {Object} params - Parâmetros para listar webhooks
 * @param {string} params.shop - Domínio da loja Shopify
 * @param {string} params.sessionToken - Token de sessão
 * @returns {Promise<Object>} Lista de webhooks
 */
export async function listWebhooks({ shop, sessionToken }) {
  const admin = await shopifyAdminClient({ shop, sessionToken });

  const webhookSubscriptions = `
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
  `;

  const response = await admin.graphql({
    data: {
      query: webhookSubscriptions,
    },
  });

  return response;
}

/**
 * Remove um webhook específico
 * @param {Object} params - Parâmetros para remover webhook
 * @param {string} params.shop - Domínio da loja Shopify
 * @param {string} params.sessionToken - Token de sessão
 * @param {string} params.id - ID do webhook a ser removido
 * @returns {Promise<Object>} Resultado da remoção
 */
export async function deleteWebhook({ shop, sessionToken, id }) {
  const admin = await shopifyAdminClient({ shop, sessionToken });

  const webhookSubscriptionDelete = `
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

  const response = await admin.graphql({
    data: {
      query: webhookSubscriptionDelete,
      variables: { id },
    },
  });

  return response;
}
