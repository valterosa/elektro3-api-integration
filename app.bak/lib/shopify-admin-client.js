import shopify from "../shopify.server";
import { SHOPIFY_CONFIG } from "../config";

/**
 * Cria um cliente GraphQL Admin API autenticado para um determinado token de sessão
 * Este cliente permite fazer requisições autenticadas à API Admin do Shopify
 *
 * @param {Object} params - Parâmetros para criar o cliente
 * @param {string} params.shop - Domínio da loja Shopify
 * @param {string} params.sessionToken - Token de sessão do Shopify
 * @returns {Object} Cliente GraphQL autenticado
 */
export async function shopifyAdminClient({ shop, sessionToken }) {
  const { admin } = await shopify.authenticate.admin({
    shop,
    sessionToken,
  });

  return admin;
}

/**
 * Wrapper para executar consultas GraphQL na API Admin do Shopify
 * Centraliza o tratamento de erros e facilita a realização de consultas GraphQL
 *
 * @param {Object} params - Parâmetros para a consulta
 * @param {string} params.shop - Domínio da loja Shopify
 * @param {string} params.sessionToken - Token de sessão do Shopify
 * @param {string} params.query - Consulta GraphQL
 * @param {Object} [params.variables={}] - Variáveis para a consulta GraphQL
 * @returns {Promise<Object>} Resultado da consulta
 */
export async function queryAdminApi({
  shop,
  sessionToken,
  query,
  variables = {},
}) {
  try {
    const client = await shopifyAdminClient({ shop, sessionToken });

    const response = await client.graphql({
      data: {
        query,
        variables,
      },
    });

    return response;
  } catch (error) {
    console.error("Erro na consulta GraphQL à API Admin:", error);
    // Adicionar mais informações detalhadas do erro para facilitar a depuração
    if (error.response) {
      console.error("Detalhes da resposta:", error.response);
    }
    throw error;
  }
}

/**
 * Cria um cliente para acesso direto à API Admin do Shopify
 * Útil para casos onde não temos um token de sessão, mas temos o token de acesso administrativo
 *
 * @returns {Object} Cliente com métodos para acessar a API Admin
 */
export function createDirectAdminClient() {
  const shop = SHOPIFY_CONFIG.SHOP;
  const accessToken = SHOPIFY_CONFIG.ADMIN_API_ACCESS_TOKEN;
  const apiVersion = SHOPIFY_CONFIG.API_VERSION;

  if (!shop || !accessToken) {
    console.warn("⚠️ Configurações do Shopify incompletas para cliente direto");
    return null;
  }

  /**
   * Executa uma consulta GraphQL na API Admin
   * @param {string} query - Consulta GraphQL
   * @param {Object} variables - Variáveis para a consulta
   * @returns {Promise<Object>} Resultado da consulta
   */
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
      throw new Error(`Erro GraphQL (${response.status}): ${errorText}`);
    }

    const jsonResponse = await response.json();

    // Verificar se a resposta contém erros
    if (jsonResponse.errors) {
      const errorMessage = jsonResponse.errors.map((e) => e.message).join(", ");
      throw new Error(`Erro GraphQL: ${errorMessage}`);
    }

    return jsonResponse;
  }

  /**
   * Executa uma requisição REST na API Admin
   * @param {string} endpoint - Endpoint da API (sem domínio nem versão)
   * @param {string} method - Método HTTP
   * @param {Object} data - Dados para enviar no corpo da requisição
   * @returns {Promise<Object>} Resultado da requisição
   */
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
      throw new Error(`Erro REST (${response.status}): ${errorText}`);
    }

    return await response.json();
  }

  return {
    graphql,
    rest,
    shop,
  };
}

// Exportar uma instância do cliente direto para uso em toda a aplicação
export const directAdminClient = createDirectAdminClient();
