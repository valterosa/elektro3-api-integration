/**
 * Cliente para a API Admin GraphQL do Shopify
 */
import { authenticate } from "../shopify.server";
import { GraphqlQueryError } from "@shopify/shopify-api";

/**
 * Função para executar consultas GraphQL na API Admin do Shopify
 * @param {string} shop Nome da loja Shopify
 * @param {Object} sessionToken Token de sessão do usuário autenticado
 * @param {string} query Consulta GraphQL
 * @param {Object} variables Variáveis para a consulta GraphQL
 * @returns {Promise<Object>} Resultado da consulta GraphQL
 */
export async function shopifyAdminGraphql({
  shop,
  sessionToken,
  query,
  variables,
}) {
  try {
    const { admin } = await authenticate.admin(sessionToken);
    return await admin.graphql(query, { variables });
  } catch (error) {
    if (error instanceof GraphqlQueryError) {
      throw new Error(
        `Erro na API GraphQL do Shopify: ${error.message}\n${JSON.stringify(error.response, null, 2)}`
      );
    }
    throw error;
  }
}

/**
 * Função para executar consultas REST na API Admin do Shopify
 * @param {string} shop Nome da loja Shopify
 * @param {Object} sessionToken Token de sessão do usuário autenticado
 * @param {string} path Caminho REST
 * @param {string} method Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object} body Corpo da requisição (opcional)
 * @returns {Promise<Object>} Resultado da consulta REST
 */
export async function shopifyAdminRest({
  shop,
  sessionToken,
  path,
  method = "GET",
  body,
}) {
  try {
    const { admin } = await authenticate.admin(sessionToken);
    return await admin.rest[method.toLowerCase()]({
      path,
      data: body,
    });
  } catch (error) {
    throw new Error(`Erro na API REST do Shopify: ${error.message}`);
  }
}

export default {
  graphql: shopifyAdminGraphql,
  rest: shopifyAdminRest,
};
