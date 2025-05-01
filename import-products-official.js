// Script para importar 3 produtos da API Elektro3 para o Shopify (Baseado na documentação oficial)
require("dotenv").config();
const fetch = require("node-fetch");

// Configurações da API Elektro3
const ELEKTRO3_API_URL =
  process.env.ELEKTRO3_API_URL || "https://api.elektro3.com";
const ELEKTRO3_CLIENT_ID = process.env.ELEKTRO3_CLIENT_ID;
const ELEKTRO3_SECRET_KEY = process.env.ELEKTRO3_SECRET_KEY;
const ELEKTRO3_USERNAME = process.env.ELEKTRO3_USERNAME;
const ELEKTRO3_PASSWORD = process.env.ELEKTRO3_PASSWORD;

// Configurações do Shopify
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

/**
 * Autenticar na API da Elektro3 usando o endpoint correto (/oauth/token)
 * Baseado na documentação oficial: https://elektro3-projects.gitlab.io/elektro3-api/elektro3-api-old-doc/es/
 */
async function authenticate() {
  try {
    console.log("Autenticando na API Elektro3 usando endpoint /oauth/token...");

    // Formato correto conforme documentação (usando grant_type)
    const authPayload = {
      grant_type: "password",
      client_id: ELEKTRO3_CLIENT_ID,
      client_secret: ELEKTRO3_SECRET_KEY,
      username: ELEKTRO3_USERNAME,
      password: ELEKTRO3_PASSWORD,
    };

    console.log("Dados de autenticação:", JSON.stringify(authPayload, null, 2));

    const response = await fetch(`${ELEKTRO3_API_URL}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(authPayload),
    });

    const status = response.status;
    console.log("Status da resposta de autenticação:", status);

    const responseBody = await response.text();
    console.log("Resposta completa:", responseBody);

    if (!response.ok) {
      throw new Error(
        `Erro na autenticação: ${status} ${response.statusText} - ${responseBody}`
      );
    }

    const data = JSON.parse(responseBody);
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
 */
async function fetchProductsFromElektro3API(limit = 3) {
  try {
    const token = await authenticate();
    console.log(
      "Buscando produtos da API Elektro3 usando endpoint /api/get-productos..."
    );

    // Vamos tentar várias abordagens para o formato do filtro
    const payloads = [
      // Abordagem 1: Filtro como objeto vazio
      {
        limit: limit,
        page: 1,
        filter: {},
      },
      // Abordagem 2: Filtro como string JSON
      {
        limit: limit,
        page: 1,
        filter: "{}",
      },
      // Abordagem 3: Sem filtro
      {
        limit: limit,
        page: 1,
      },
      // Abordagem 4: Filtro com formato específico
      {
        limit: limit,
        page: 1,
        filter: '{"activo":1}',
      },
    ];

    let lastError = null;

    // Tentar cada formato de payload
    for (let i = 0; i < payloads.length; i++) {
      try {
        console.log(`\nTentativa ${i + 1}: ${JSON.stringify(payloads[i])}`);

        const response = await fetch(`${ELEKTRO3_API_URL}/api/get-productos`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payloads[i]),
        });

        const status = response.status;
        console.log(`Status da resposta (tentativa ${i + 1}):`, status);

        const responseBody = await response.text();
        console.log(
          `Resposta (tentativa ${i + 1}, primeiros 300 caracteres):`,
          responseBody.substring(0, 300)
        );

        if (!response.ok) {
          throw new Error(
            `Erro na requisição: ${status} ${response.statusText} - ${responseBody}`
          );
        }

        const data = JSON.parse(responseBody);

        // Verificar se há erros na resposta
        if (data.status && data.status !== 0 && data.errors) {
          throw new Error(
            `API retornou status de erro: ${JSON.stringify(data.errors)}`
          );
        }

        // Verificar a estrutura da resposta para encontrar produtos
        let products = [];
        let found = false;

        if (Array.isArray(data)) {
          products = data;
          found = true;
        } else if (data.data && Array.isArray(data.data)) {
          products = data.data;
          found = true;
        } else if (data.productos && Array.isArray(data.productos)) {
          products = data.productos;
          found = true;
        } else if (data.message === "Sin datos") {
          console.log(
            'A API retornou "Sin datos" - não há produtos disponíveis'
          );
          return [];
        } else {
          // Procurar por qualquer array na resposta que possa conter produtos
          for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
              // Verificar se parece com um array de produtos (verificando propriedades comuns)
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
        }

        if (found) {
          console.log(`Encontrados ${products.length} produtos.`);

          // Limitar a quantidade de produtos se necessário
          if (products.length > limit) {
            products = products.slice(0, limit);
            console.log(`Limitado a ${limit} produtos para importação.`);
          }

          return products;
        } else {
          console.log(
            "Não foi possível encontrar produtos na resposta. Tentando próximo formato..."
          );
        }
      } catch (error) {
        console.log(`Erro na tentativa ${i + 1}:`, error.message);
        lastError = error;
      }
    }

    // Se chegamos aqui, todas as tentativas falharam
    throw new Error(
      lastError
        ? lastError.message
        : "Todas as tentativas falharam ao buscar produtos"
    );
  } catch (error) {
    console.error("Erro ao buscar produtos da API Elektro3:", error);
    throw error;
  }
}

/**
 * Importar produtos para o Shopify usando a API Admin
 */
async function importProductsToShopify(products) {
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

      console.log(
        "Produto formatado para o Shopify:",
        JSON.stringify(shopifyProduct, null, 2)
      );

      // Criar produto no Shopify via API REST
      console.log(`Enviando para Shopify: ${nombre}`);

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

      const responseTextShopify = await shopifyResponse.text();
      console.log(
        "Resposta do Shopify (primeiros 300 caracteres):",
        responseTextShopify.substring(0, 300)
      );

      if (!shopifyResponse.ok) {
        throw new Error(
          `Erro ao criar produto no Shopify: ${statusShopify} ${shopifyResponse.statusText} - ${responseTextShopify}`
        );
      }

      const shopifyData = JSON.parse(responseTextShopify);

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
 * Função principal
 */
async function main() {
  try {
    console.log(
      "================================================================="
    );
    console.log("IMPORTAÇÃO DE PRODUTOS DA ELEKTRO3 PARA SHOPIFY");
    console.log(
      "================================================================="
    );
    console.log("URL da API Elektro3:", ELEKTRO3_API_URL);
    console.log("Loja Shopify:", SHOPIFY_SHOP);
    console.log(
      "================================================================="
    );

    // Buscar produtos da API Elektro3
    const products = await fetchProductsFromElektro3API(3);

    if (products.length === 0) {
      console.log("Nenhum produto encontrado na API Elektro3.");
      return;
    }

    // Mostrar produtos encontrados
    console.log("\nProdutos encontrados:");
    products.forEach((product, index) => {
      const codigo = product.codigo || product.sku || product.id;
      const nombre = product.nombre || product.name || product.title;
      const precio = product.precio || product.price;
      console.log(`${index + 1}. ${nombre} (${codigo}) - €${precio}`);
    });

    // Importar produtos para o Shopify
    const results = await importProductsToShopify(products);

    // Exibir resultados
    console.log("\n===== RESULTADO DA IMPORTAÇÃO =====");
    console.log(`Total de produtos: ${products.length}`);
    console.log(
      `Produtos importados com sucesso: ${
        results.filter((r) => r.status === "success").length
      }`
    );
    console.log(
      `Produtos com erro: ${results.filter((r) => r.status === "error").length}`
    );

    console.log("\nDetalhes dos produtos importados:");
    results.forEach((result) => {
      if (result.status === "success") {
        console.log(
          `✅ ${result.title} (SKU: ${result.elektro3Id}) - ID no Shopify: ${result.shopifyId}`
        );
      } else {
        console.log(`❌ SKU: ${result.elektro3Id} - Erro: ${result.error}`);
      }
    });

    console.log("\nImportação concluída!");
  } catch (error) {
    console.error("Erro durante o processo de importação:", error);
  }
}

// Executar o script
main();
