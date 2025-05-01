// Script para importar 3 produtos da API Elektro3 para o Shopify
require("dotenv").config();
const fetch = require("node-fetch");

// Configurações da API Elektro3
const ELEKTRO3_API_URL = process.env.ELEKTRO3_API_URL;
const ELEKTRO3_CLIENT_ID = process.env.ELEKTRO3_CLIENT_ID;
const ELEKTRO3_SECRET_KEY = process.env.ELEKTRO3_SECRET_KEY;
const ELEKTRO3_USERNAME = process.env.ELEKTRO3_USERNAME;
const ELEKTRO3_PASSWORD = process.env.ELEKTRO3_PASSWORD;

// Configurações do Shopify
const SHOPIFY_SHOP = process.env.SHOPIFY_SHOP;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN =
  process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN;

/**
 * Autenticar na API da Elektro3 com múltiplas tentativas
 */
async function authenticate() {
  try {
    console.log("Autenticando na API Elektro3...");

    // Tentativa 1: Endpoint /auth
    try {
      console.log("Tentativa 1: Usando endpoint /auth");
      const response = await fetch(`${ELEKTRO3_API_URL}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: ELEKTRO3_CLIENT_ID,
          secretKey: ELEKTRO3_SECRET_KEY,
          username: ELEKTRO3_USERNAME,
          password: ELEKTRO3_PASSWORD,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Autenticação bem-sucedida com endpoint /auth!");
        return data.accessToken;
      }

      console.log(
        "Primeira tentativa falhou:",
        response.status,
        response.statusText
      );
    } catch (err) {
      console.log("Erro na primeira tentativa:", err.message);
    }

    // Tentativa 2: Endpoint /api/auth
    try {
      console.log("Tentativa 2: Usando endpoint /api/auth");
      const response = await fetch(`${ELEKTRO3_API_URL}/api/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: ELEKTRO3_CLIENT_ID,
          secretKey: ELEKTRO3_SECRET_KEY,
          username: ELEKTRO3_USERNAME,
          password: ELEKTRO3_PASSWORD,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Autenticação bem-sucedida com endpoint /api/auth!");
        return data.accessToken;
      }

      console.log(
        "Segunda tentativa falhou:",
        response.status,
        response.statusText
      );
    } catch (err) {
      console.log("Erro na segunda tentativa:", err.message);
    }

    // Tentativa 3: Formato alternativo de corpo
    try {
      console.log("Tentativa 3: Usando formato alternativo de corpo");
      const response = await fetch(`${ELEKTRO3_API_URL}/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: ELEKTRO3_CLIENT_ID,
          secret_key: ELEKTRO3_SECRET_KEY,
          user: ELEKTRO3_USERNAME,
          password: ELEKTRO3_PASSWORD,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          "Autenticação bem-sucedida com formato alternativo de corpo!"
        );
        return data.accessToken;
      }

      console.log(
        "Terceira tentativa falhou:",
        response.status,
        response.statusText
      );
    } catch (err) {
      console.log("Erro na terceira tentativa:", err.message);
    }

    // Tentativa 4: Endpoint /api/v1/auth (formato comum em APIs com versão)
    try {
      console.log("Tentativa 4: Usando endpoint com versão /api/v1/auth");
      const response = await fetch(`${ELEKTRO3_API_URL}/api/v1/auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: ELEKTRO3_CLIENT_ID,
          secretKey: ELEKTRO3_SECRET_KEY,
          username: ELEKTRO3_USERNAME,
          password: ELEKTRO3_PASSWORD,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Autenticação bem-sucedida com endpoint /api/v1/auth!");
        return data.accessToken;
      }

      console.log(
        "Quarta tentativa falhou:",
        response.status,
        response.statusText
      );
    } catch (err) {
      console.log("Erro na quarta tentativa:", err.message);
    }

    // Se todas as tentativas falharem, lance um erro
    throw new Error(
      "Falha na autenticação após múltiplas tentativas. Verifique as credenciais e o URL da API."
    );
  } catch (error) {
    console.error("Erro ao autenticar na API Elektro3:", error);
    throw error;
  }
}

/**
 * Buscar produtos da API da Elektro3
 */
async function fetchProductsFromElektro3API() {
  try {
    const token = await authenticate();
    console.log("Buscando produtos da API Elektro3...");

    // Tentar com diferentes formatos de endpoints
    let response;
    let errorMessages = [];

    // Tentativa 1: /products
    try {
      console.log("Tentando buscar produtos com endpoint /products");
      response = await fetch(`${ELEKTRO3_API_URL}/products?limit=3`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `Encontrados ${data.data ? data.data.length : 0} produtos.`
        );
        return data.data || [];
      }

      errorMessages.push(
        `Tentativa 1 falhou: ${response.status} ${response.statusText}`
      );
    } catch (err) {
      errorMessages.push(`Erro na tentativa 1: ${err.message}`);
    }

    // Tentativa 2: /api/products
    try {
      console.log("Tentando buscar produtos com endpoint /api/products");
      response = await fetch(`${ELEKTRO3_API_URL}/api/products?limit=3`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `Encontrados ${data.data ? data.data.length : 0} produtos.`
        );
        return data.data || [];
      }

      errorMessages.push(
        `Tentativa 2 falhou: ${response.status} ${response.statusText}`
      );
    } catch (err) {
      errorMessages.push(`Erro na tentativa 2: ${err.message}`);
    }

    // Tentativa 3: /api/v1/products
    try {
      console.log("Tentando buscar produtos com endpoint /api/v1/products");
      response = await fetch(`${ELEKTRO3_API_URL}/api/v1/products?limit=3`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          `Encontrados ${data.data ? data.data.length : 0} produtos.`
        );
        return data.data || [];
      }

      errorMessages.push(
        `Tentativa 3 falhou: ${response.status} ${response.statusText}`
      );
    } catch (err) {
      errorMessages.push(`Erro na tentativa 3: ${err.message}`);
    }

    throw new Error(
      `Falha ao buscar produtos após múltiplas tentativas: ${errorMessages.join(
        ", "
      )}`
    );
  } catch (error) {
    console.error("Erro ao buscar produtos da API Elektro3:", error);
    throw error;
  }
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

      // Adicionar imagens adicionais se existirem
      if (
        product.imagenes_adicionales &&
        Array.isArray(product.imagenes_adicionales)
      ) {
        product.imagenes_adicionales.forEach((img) => {
          if (img.imagen) {
            shopifyProduct.images.push({
              src: img.imagen,
            });
          }
        });
      }

      // Criar produto no Shopify via API REST
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

      if (!shopifyResponse.ok) {
        const errorData = await shopifyResponse.json();
        throw new Error(
          `Erro ao criar produto no Shopify: ${JSON.stringify(errorData)}`
        );
      }

      const shopifyData = await shopifyResponse.json();

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
      "Iniciando importação de 3 produtos da Elektro3 para o Shopify..."
    );
    console.log("URL da API Elektro3:", ELEKTRO3_API_URL);
    console.log("Loja Shopify:", SHOPIFY_SHOP);

    // Buscar produtos da API Elektro3
    const products = await fetchProductsFromElektro3API();

    if (products.length === 0) {
      console.log("Nenhum produto encontrado na API Elektro3.");
      return;
    }

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
