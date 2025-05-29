/**
 * Serviço para comunicação com a API da Elektro3
 * Este arquivo contém funções para buscar produtos e categorias da API da Elektro3
 * e importá-los para o Shopify
 */

import { ELEKTRO3_CONFIG, SHOPIFY_CONFIG } from "../config.js";

// Configurações da API Elektro3
const ELEKTRO3_API_URL = ELEKTRO3_CONFIG.API_URL;
const ELEKTRO3_CLIENT_ID = ELEKTRO3_CONFIG.CLIENT_ID;
const ELEKTRO3_SECRET_KEY = ELEKTRO3_CONFIG.SECRET_KEY;
const ELEKTRO3_USERNAME = ELEKTRO3_CONFIG.USERNAME;
const ELEKTRO3_PASSWORD = ELEKTRO3_CONFIG.PASSWORD;

// Configurações do Shopify
const SHOPIFY_SHOP = SHOPIFY_CONFIG.SHOP;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = SHOPIFY_CONFIG.ADMIN_API_ACCESS_TOKEN;

// Logs para depuração
console.log("Elektro3 API URL:", ELEKTRO3_API_URL);
console.log("Elektro3 credentials configured:", {
  hasClientId: !!ELEKTRO3_CLIENT_ID,
  hasSecretKey: !!ELEKTRO3_SECRET_KEY,
  hasUsername: !!ELEKTRO3_USERNAME,
  hasPassword: !!ELEKTRO3_PASSWORD,
});

import axios from "axios";

/**
 * Autenticar na API da Elektro3 (formato atualizado)
 * @returns {Promise<string>} Token de acesso
 */
export async function authenticate() {
  try {
    // Verificar se todas as credenciais estão configuradas
    if (
      !ELEKTRO3_CLIENT_ID ||
      !ELEKTRO3_SECRET_KEY ||
      !ELEKTRO3_USERNAME ||
      !ELEKTRO3_PASSWORD
    ) {
      throw new Error(
        "Missing Elektro3 API credentials. Please check your environment variables."
      );
    }

    console.log("Autenticando na API Elektro3 usando endpoint /oauth/token...");

    // Formato correto conforme documentação (usando grant_type)
    const authPayload = {
      grant_type: "password",
      client_id: ELEKTRO3_CLIENT_ID,
      client_secret: ELEKTRO3_SECRET_KEY,
      username: ELEKTRO3_USERNAME,
      password: ELEKTRO3_PASSWORD,
    };

    // Fazer a solicitação de autenticação para o endpoint correto
    const response = await fetch(`${ELEKTRO3_API_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(authPayload),
    });

    const status = response.status;
    console.log("Status da resposta de autenticação:", status);

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `Erro na autenticação: ${status} ${response.statusText} - ${responseBody}`
      );
    }

    const data = await response.json();
    console.log("Autenticação bem-sucedida!");

    // Extrair o token de acesso do formato correto (pode ser .access_token ou .token)
    const accessToken = data.access_token || data.token;

    if (!accessToken) {
      throw new Error("Token de acesso não encontrado na resposta");
    }

    return accessToken;
  } catch (error) {
    console.error("Erro ao autenticar na API Elektro3:", error);
    throw error;
  }
}

/**
 * Buscar produtos da API da Elektro3 usando o endpoint correto (/api/get-productos)
 * @param {Object} options Opções de filtro
 * @param {number} options.page Página atual
 * @param {number} options.limit Limite de produtos por página
 * @param {Object} options.filter Filtros adicionais
 * @returns {Promise<Object>} Produtos encontrados
 */
export async function fetchProductsFromElektro3API(options = {}) {
  try {
    const token = await authenticate();
    console.log(
      "Buscando produtos da API Elektro3 usando endpoint /api/get-productos..."
    );

    // Construir o objeto de payload sem incluir o campo filter se estiver vazio
    const payload = {
      limit: options.limit || 20,
      page: options.page || 1,
    };

    // Adicionar o filtro apenas se existir e não for vazio
    if (options.filter && Object.keys(options.filter).length > 0) {
      // Tentar converter para string JSON se for um objeto
      if (typeof options.filter === "object") {
        payload.filter = JSON.stringify(options.filter);
      } else {
        payload.filter = options.filter;
      }
    }

    const response = await fetch(`${ELEKTRO3_API_URL}/api/get-productos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const status = response.status;
    console.log("Status da resposta de busca de produtos:", status);

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `Erro ao buscar produtos: ${status} ${response.statusText} - ${responseBody}`
      );
    }

    const data = await response.json();

    // Verificar a estrutura da resposta
    let products = [];

    if (Array.isArray(data)) {
      products = data;
    } else if (data.data && Array.isArray(data.data)) {
      products = data.data;
    } else if (data.productos && Array.isArray(data.productos)) {
      products = data.productos;
    } else if (data.message === "Sin datos") {
      console.log('A API retornou "Sin datos" - não há produtos disponíveis');
      return { products: [], totalProducts: 0 };
    } else if (data.status && data.status !== 0 && data.errors) {
      throw new Error(
        `API retornou status de erro: ${JSON.stringify(data.errors)}`
      );
    } else {
      // Procurar por qualquer array na resposta que possa conter produtos
      let found = false;
      for (const key in data) {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          const firstItem = data[key][0];
          if (
            firstItem &&
            (firstItem.codigo || firstItem.nombre || firstItem.precio)
          ) {
            products = data[key];
            found = true;
            console.log(`Encontrado array de produtos no campo "${key}"`);
            break;
          }
        }
      }

      if (!found) {
        console.log("Estrutura da resposta:", JSON.stringify(data, null, 2));
        throw new Error("Formato de resposta não reconhecido");
      }
    }

    console.log(`Encontrados ${products.length} produtos.`);

    const totalProducts = data.total_items || products.length;
    const totalPages =
      data.total_pages || Math.ceil(totalProducts / (options.limit || 20));

    return {
      products,
      totalProducts,
      totalPages,
      currentPage: options.page || 1,
    };
  } catch (error) {
    console.error("Erro ao buscar produtos da API Elektro3:", error);
    throw error;
  }
}

/**
 * Buscar um produto específico pelo código
 * @param {string} productCode Código do produto
 * @returns {Promise<Object>} Detalhes do produto
 */
export async function fetchProductDetails(productCode) {
  try {
    const token = await authenticate();

    // Tentar usar o endpoint GET específico se disponível
    try {
      const response = await fetch(
        `${ELEKTRO3_API_URL}/api/get-producto/${productCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.log(
        "Endpoint específico não disponível, tentando método alternativo"
      );
    }

    // Se o endpoint específico falhar, buscar todos os produtos e filtrar
    const allProductsResult = await fetchProductsFromElektro3API({
      filter: { codigo: productCode },
      limit: 1,
    });

    const product = allProductsResult.products.find(
      (p) => p.codigo === productCode
    );

    if (!product) {
      throw new Error(`Produto com código ${productCode} não encontrado`);
    }

    return product;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do produto ${productCode}:`, error);
    throw error;
  }
}

/**
 * Importar produtos da Elektro3 para o Shopify
 * @param {Array} products Lista de produtos para importar
 * @returns {Promise<Array>} Resultados da importação
 */
export async function importProductsToShopify(products) {
  console.log("Importando produtos para o Shopify...");
  const results = [];

  for (const product of products) {
    try {
      // Identificar campos corretos com base na documentação
      const codigo = product.codigo || product.sku || product.id;
      const nombre = product.nombre || product.name || product.title;
      const precio = product.precio || product.price;
      const stock = product.stock || product.inventory_quantity || 0;
      const descripcion = product.descripcion || product.description || "";
      const marca = product.marca || product.brand || "Elektro3";
      const categoria = product.categoria || product.category || "";
      const subfamilia = product.subfamilia || product.subcategory || "";
      const imagen =
        product.imagen || product.image || product.images?.[0]?.src;

      console.log(`Importando produto: ${nombre} (${codigo})...`);

      // Transformar produto da Elektro3 para o formato do Shopify
      const shopifyProduct = {
        title: nombre || "Produto sem nome",
        body_html: descripcion || "",
        vendor: marca || "Elektro3",
        product_type: subfamilia || categoria || "",
        tags: `${product.codigo_familia || ""}, ${subfamilia || ""}`.trim(),
        status: "active",
        variants: [
          {
            price:
              (typeof precio === "number" ? precio.toString() : precio) ||
              "0.00",
            inventory_quantity: stock || 0,
            requires_shipping: true,
            sku: codigo || "",
            barcode: product.ean13 || product.barcode || "",
            weight: product.peso || product.weight || 0,
            weight_unit: "kg",
          },
        ],
        images: [],
      };

      // Adicionar imagem principal se existir
      if (imagen) {
        shopifyProduct.images.push({
          src: imagen,
        });
      }

      // Adicionar imagens adicionais se existirem
      if (
        product.imagenes_adicionales &&
        Array.isArray(product.imagenes_adicionales)
      ) {
        product.imagenes_adicionales.forEach((img) => {
          if (img.imagen || img.src) {
            shopifyProduct.images.push({
              src: img.imagen || img.src,
            });
          }
        });
      }

      // Criar produto no Shopify via API REST
      console.log(`Enviando para Shopify: ${nombre}`);

      if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
        throw new Error("Credenciais do Shopify não configuradas");
      }

      const shopifyResponse = await fetch(
        `https://${SHOPIFY_SHOP}/admin/api/2023-04/products.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
          },
          body: JSON.stringify({ product: shopifyProduct }),
        }
      );

      const statusShopify = shopifyResponse.status;
      console.log("Status da resposta do Shopify:", statusShopify);

      if (!shopifyResponse.ok) {
        const responseTextShopify = await shopifyResponse.text();
        throw new Error(
          `Erro ao criar produto no Shopify: ${statusShopify} ${shopifyResponse.statusText} - ${responseTextShopify}`
        );
      }

      const shopifyData = await shopifyResponse.json();

      results.push({
        elektro3Id: codigo,
        shopifyId: shopifyData.product.id,
        title: shopifyProduct.title,
        status: "success",
      });

      console.log(`Produto importado com sucesso: ${nombre}`);
    } catch (error) {
      console.error(`Erro ao importar produto:`, error);
      results.push({
        elektro3Id: product.codigo || product.sku || "desconhecido",
        error: error.message,
        status: "error",
      });
    }
  }

  return results;
}

/**
 * Obter todas as categorias da API da Elektro3
 * @returns {Promise<Array>} Lista de categorias
 */
export async function fetchCategories() {
  try {
    const token = await authenticate();

    // Tentar o endpoint específico para categorias
    try {
      const response = await fetch(`${ELEKTRO3_API_URL}/api/get-categorias`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();

        // Verificar a estrutura da resposta
        if (Array.isArray(data)) {
          return data;
        } else if (data.data && Array.isArray(data.data)) {
          return data.data;
        } else if (data.categorias && Array.isArray(data.categorias)) {
          return data.categorias;
        }
      }
    } catch (err) {
      console.log(
        "Erro ao buscar categorias com endpoint principal, tentando alternativo"
      );
    }

    // Se o endpoint principal falhar, tentar endpoint alternativo
    const response = await fetch(`${ELEKTRO3_API_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar categorias: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    throw error;
  }
}

/**
 * Testar a conexão com a API da Elektro3 e Shopify
 * @returns {Promise<Object>} Status da conexão
 */
export async function testConnections() {
  const result = {
    elektro3: { success: false, message: "" },
    shopify: { success: false, message: "" },
  };

  // Testar conexão com Elektro3
  try {
    const token = await authenticate();
    result.elektro3.success = true;
    result.elektro3.message =
      "Conexão com a API Elektro3 estabelecida com sucesso";
    result.elektro3.token = token.substring(0, 10) + "...";
  } catch (error) {
    result.elektro3.success = false;
    result.elektro3.message = `Erro ao conectar à API Elektro3: ${error.message}`;
  }

  // Testar conexão com Shopify
  try {
    if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
      throw new Error("Credenciais do Shopify não configuradas");
    }

    const shopResponse = await fetch(
      `https://${SHOPIFY_SHOP}/admin/api/2023-04/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        },
      }
    );

    if (!shopResponse.ok) {
      const responseText = await shopResponse.text();
      throw new Error(`Erro: ${shopResponse.status} - ${responseText}`);
    }

    const shopData = await shopResponse.json();
    result.shopify.success = true;
    result.shopify.message = `Conexão com a API Shopify estabelecida com sucesso`;
    result.shopify.shopName = shopData.shop?.name;
  } catch (error) {
    result.shopify.success = false;
    result.shopify.message = `Erro ao conectar à API Shopify: ${error.message}`;
  }

  return result;
}
