// Script para importar 3 produtos da API Elektro3 para o Shopify (VERSÃO SIMULADA)
require("dotenv").config();
const fetch = require("node-fetch");

// Configurações do Shopify
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

/**
 * Buscar produtos simulados da Elektro3
 */
async function getSimulatedElektro3Products() {
  console.log("Obtendo dados simulados de produtos da Elektro3...");

  // Produtos simulados da Elektro3
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
 * Importar produtos para o Shopify
 */
async function importProductsToShopify(products) {
  console.log("Importando produtos para o Shopify...");
  const results = [];

  for (const product of products) {
    try {
      console.log(
        `Importando produto: ${product.nombre} (${product.codigo})...`
      );

      // Transformar produto da Elektro3 para o formato do Shopify
      const shopifyProduct = {
        title: product.nombre || "Produto sem nome",
        body_html: product.descripcion || "",
        vendor: product.marca || "Elektro3",
        product_type: product.subfamilia || product.categoria || "",
        tags: `${product.codigo_familia || ""}, ${
          product.subfamilia || ""
        }`.trim(),
        status: "active",
        variants: [
          {
            price: product.precio?.toString() || "0.00",
            inventory_quantity: product.stock || 0,
            requires_shipping: true,
            sku: product.codigo || "",
            barcode: product.ean13 || "",
            weight: product.peso || 0,
            weight_unit: "kg",
          },
        ],
        images: [],
      };

      // Adicionar imagem principal se existir
      if (product.imagen) {
        shopifyProduct.images.push({
          src: product.imagen,
        });
      }

      // Tentar criar o produto no Shopify
      console.log(`Enviando produto para o Shopify: ${product.nombre}`);
      console.log(
        "URL da API Shopify:",
        `https://${SHOPIFY_SHOP}/admin/api/2023-04/products.json`
      );

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

      console.log("Status da resposta do Shopify:", shopifyResponse.status);

      const responseText = await shopifyResponse.text();
      console.log("Resposta do Shopify:", responseText);

      if (!shopifyResponse.ok) {
        throw new Error(`Erro ao criar produto no Shopify: ${responseText}`);
      }

      const shopifyData = JSON.parse(responseText);

      results.push({
        elektro3Id: product.codigo,
        shopifyId: shopifyData.product.id,
        title: shopifyProduct.title,
        status: "success",
      });

      console.log(`Produto importado com sucesso: ${product.nombre}`);
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
