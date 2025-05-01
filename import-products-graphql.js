// Script para importar 3 produtos simulados para o Shopify (VERSÃO COM GRAPHQL)
require("dotenv").config();
const fetch = require("node-fetch");

// Configurações do Shopify
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET_KEY = process.env.SHOPIFY_API_SECRET_KEY;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

/**
 * Obter produtos simulados da Elektro3
 */
async function getSimulatedElektro3Products() {
  console.log("Obtendo dados simulados de produtos da Elektro3...");

  return [
    {
      codigo: "EK-10234",
      nombre: "Berbequim Elétrico 850W",
      descripcion:
        "Berbequim elétrico potente com 850W de potência, ideal para trabalhos profissionais e bricolage. Inclui mandril de 13mm e acessórios.",
      precio: 89.99,
      stock: 35,
      marca: "Elektro3",
      categoria: "Ferramentas Elétricas",
      subfamilia: "Berbequins",
      codigo_familia: "FERRAM",
      peso: 2.5,
      ean13: "8422203123456",
      imagen: "https://m.media-amazon.com/images/I/71RySbrT3xL._AC_SL1500_.jpg",
    },
    {
      codigo: "EK-20567",
      nombre: "Serra Circular 1200W",
      descripcion:
        "Serra circular potente com 1200W, disco de 185mm, corte em ângulo até 45°. Ideal para cortes precisos em madeira e derivados.",
      precio: 124.99,
      stock: 12,
      marca: "Elektro3",
      categoria: "Ferramentas Elétricas",
      subfamilia: "Serras",
      codigo_familia: "FERRAM",
      peso: 3.8,
      ean13: "8422203123789",
      imagen: "https://m.media-amazon.com/images/I/71H2C3hUK+L._AC_SL1500_.jpg",
    },
    {
      codigo: "EK-30891",
      nombre: "Rebarbadora Angular 900W",
      descripcion:
        "Rebarbadora angular com 900W de potência, disco de 115mm, proteção contra arranque acidental. Inclui punho lateral e chave.",
      precio: 59.99,
      stock: 25,
      marca: "Elektro3",
      categoria: "Ferramentas Elétricas",
      subfamilia: "Rebarbadoras",
      codigo_familia: "FERRAM",
      peso: 2.1,
      ean13: "8422203124567",
      imagen: "https://m.media-amazon.com/images/I/61nScYqfRiL._AC_SL1500_.jpg",
    },
  ];
}

/**
 * Importar produtos para o Shopify usando a API GraphQL
 */
async function importProductsToShopify(products) {
  console.log("Importando produtos para o Shopify via GraphQL...");
  const results = [];

  // Tentar diferentes tokens de acesso se o principal falhar
  const possibleTokens = [
    SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    // Tentar gerar um novo token usando API Key e Secret
    await generateAccessToken(),
  ].filter((token) => token);

  let successfulToken = null;

  for (const token of possibleTokens) {
    if (successfulToken) break;

    console.log(`Tentando autenticação com token: ${token.substring(0, 5)}...`);

    try {
      // Verificar se o token funciona
      const shopResponse = await fetch(
        `https://${SHOPIFY_SHOP}/admin/api/2023-04/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": token,
          },
        }
      );

      if (shopResponse.ok) {
        console.log(
          "✅ Token de acesso válido! Prosseguindo com a importação."
        );
        successfulToken = token;
      } else {
        console.log(
          `❌ Token de acesso inválido: ${(await shopResponse.text()).slice(
            0,
            100
          )}...`
        );
      }
    } catch (err) {
      console.log(`Erro ao verificar token: ${err.message}`);
    }
  }

  if (!successfulToken) {
    throw new Error(
      "Não foi possível autenticar com o Shopify. Todos os tokens tentados falharam."
    );
  }

  // Importar cada produto
  for (const product of products) {
    try {
      console.log(
        `Importando produto: ${product.nombre} (${product.codigo})...`
      );

      // Transformar produto da Elektro3 para o formato do Shopify GraphQL
      const shopifyProduct = {
        title: product.nombre || "Produto sem nome",
        descriptionHtml: product.descripcion || "",
        vendor: product.marca || "Elektro3",
        productType: product.subfamilia || product.categoria || "",
        tags: [`${product.codigo_familia || ""}`, `${product.subfamilia || ""}`]
          .filter((t) => t)
          .join(","),
        status: "ACTIVE",
        variants: [
          {
            price: product.precio?.toString() || "0.00",
            inventoryQuantities: {
              availableQuantity: product.stock || 0,
              locationId: "gid://shopify/Location/1234567890", // Placeholder - será preenchido depois
            },
            requiresShipping: true,
            sku: product.codigo || "",
            barcode: product.ean13 || "",
            weight: product.peso || 0,
            weightUnit: "KILOGRAMS",
          },
        ],
        images: product.imagen ? [{ src: product.imagen }] : [],
      };

      // Primeiro, obter o ID da localização padrão
      const locationsQuery = `
        {
          locations(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      `;

      const locationsResponse = await fetch(
        `https://${SHOPIFY_SHOP}/admin/api/2023-04/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": successfulToken,
          },
          body: JSON.stringify({ query: locationsQuery }),
        }
      );

      let locationId = "gid://shopify/Location/1"; // Fallback

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        if (
          locationsData.data &&
          locationsData.data.locations &&
          locationsData.data.locations.edges &&
          locationsData.data.locations.edges.length > 0
        ) {
          locationId = locationsData.data.locations.edges[0].node.id;
          console.log(`Localização obtida: ${locationId}`);
        }
      }

      // Criar produto usando a API GraphQL
      const createProductMutation = `
        mutation productCreate($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      // Ajustar o objeto de variante para incluir o ID de localização correto
      shopifyProduct.variants[0].inventoryQuantities.locationId = locationId;

      const graphqlResponse = await fetch(
        `https://${SHOPIFY_SHOP}/admin/api/2023-04/graphql.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": successfulToken,
          },
          body: JSON.stringify({
            query: createProductMutation,
            variables: {
              input: shopifyProduct,
            },
          }),
        }
      );

      const responseText = await graphqlResponse.text();
      console.log(`Resposta GraphQL: ${responseText.substring(0, 300)}...`);

      if (!graphqlResponse.ok) {
        throw new Error(`Erro ao criar produto no Shopify: ${responseText}`);
      }

      const responseData = JSON.parse(responseText);

      if (responseData.data && responseData.data.productCreate) {
        if (
          responseData.data.productCreate.userErrors &&
          responseData.data.productCreate.userErrors.length > 0
        ) {
          throw new Error(
            `Erro na criação do produto: ${JSON.stringify(
              responseData.data.productCreate.userErrors
            )}`
          );
        }

        results.push({
          elektro3Id: product.codigo,
          shopifyId: responseData.data.productCreate.product.id,
          title: responseData.data.productCreate.product.title,
          status: "success",
        });

        console.log(`Produto importado com sucesso: ${product.nombre}`);
      } else {
        throw new Error(`Resposta inesperada do Shopify: ${responseText}`);
      }
    } catch (error) {
      console.error(
        `Erro ao importar produto ${product.codigo || "desconhecido"}:`,
        error
      );
      results.push({
        elektro3Id: product.codigo,
        error: error.message,
        status: "error",
      });
    }
  }

  return results;
}

/**
 * Tentar gerar um novo token de acesso usando API Key e Secret
 */
async function generateAccessToken() {
  if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET_KEY) {
    console.log(
      "API Key ou Secret Key não configurados, não é possível gerar um novo token"
    );
    return null;
  }

  try {
    console.log("Tentando gerar um novo token de acesso através do OAuth...");
    // Este é um processo simplificado e não funcionará sem um fluxo OAuth completo
    // Apenas para fins de demonstração
    return null;
  } catch (error) {
    console.error("Erro ao gerar token de acesso:", error);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log(
      "Iniciando importação simulada de 3 produtos da Elektro3 para o Shopify..."
    );
    console.log("Loja Shopify:", SHOPIFY_SHOP);

    // Buscar produtos simulados
    const products = await getSimulatedElektro3Products();

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
