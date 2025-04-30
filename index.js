require("dotenv").config();
const express = require("express");
const { shopifyApi, LATEST_API_VERSION } = require("@shopify/shopify-api");
// Add the Node adapter import
const { restResources } = require("@shopify/shopify-api/rest/admin/2024-04");
const { shopifyApiNodeAdapter } = require("@shopify/shopify-api/adapters/node");
const Elektro3Api = require("./elektro3-api");

const app = express();
const PORT = process.env.PORT || 3000;

// Inicializar o cliente da API Elektro3
const elektro3Client = new Elektro3Api({
  clientId: process.env.ELEKTRO3_CLIENT_ID,
  secretKey: process.env.ELEKTRO3_SECRET_KEY,
  username: process.env.ELEKTRO3_USERNAME,
  password: process.env.ELEKTRO3_PASSWORD,
  baseUrl: process.env.ELEKTRO3_API_URL,
});

// Configuração da API do Shopify com credenciais reais
const shopifyClient = shopifyApi({
  // Add the Node adapter
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET_KEY,
  scopes: ["write_products", "read_products"],
  hostName: process.env.SHOPIFY_SHOP.replace(/^https?:\/\//, "").replace(
    /\/$/,
    ""
  ),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: false,
  // Para acesso privado à API (usando token de acesso privado)
  adminApiAccessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
  // Add the adapter
  customAdapterFn: shopifyApiNodeAdapter,
  restResources,
});

const shopify = shopifyClient.rest;

// Middleware to parse JSON requests
app.use(express.json());

// Função para transformar produtos do formato Elektro3 para o formato Shopify
function mapElektro3ProductToShopify(elektro3Product) {
  // Mapear os campos do produto Elektro3 para o formato que o Shopify espera
  // Você precisará ajustar isso com base na estrutura real dos dados da Elektro3
  return {
    title: elektro3Product.name || elektro3Product.title,
    body_html: elektro3Product.description || "",
    vendor: elektro3Product.manufacturer || "Elektro3",
    product_type: elektro3Product.category || "",
    tags: elektro3Product.tags ? elektro3Product.tags.join(", ") : "",
    variants: [
      {
        price: elektro3Product.price?.toString() || "0.00",
        inventory_quantity: elektro3Product.stock || 0,
        requires_shipping: true,
        sku: elektro3Product.sku || "",
        barcode: elektro3Product.barcode || elektro3Product.ean || "",
      },
    ],
    images:
      elektro3Product.images?.map((img) => ({ src: img.url || img })) || [],
  };
}

// Função atualizada para criar produtos no Shopify
async function createShopifyProduct(productData) {
  try {
    const session = {
      shop: process.env.SHOPIFY_SHOP.replace(/^https?:\/\//, "").replace(
        /\/$/,
        ""
      ),
      accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
    };

    console.log(
      "Criando produto no Shopify:",
      JSON.stringify(productData.title)
    );

    // Usar a API REST do Shopify para criar um produto
    const response = await shopify.Product.create({
      session,
      fields: productData,
    });

    console.log("Produto criado com sucesso:", response.body);
    return response.body;
  } catch (error) {
    console.error("Erro ao criar produto no Shopify:", error.message);
    throw error;
  }
}

// Endpoint to import products from Elektro3 to Shopify
app.post("/import-products", async (req, res) => {
  try {
    console.log("Iniciando importação de produtos da Elektro3...");

    // Parâmetros de busca opcionais
    const searchParams = req.body.searchParams || {};
    // Limitar quantidade de produtos por importação (opcional)
    const limit = req.body.limit || 50;

    // Buscar produtos da API da Elektro3
    const elektro3Response = await elektro3Client.getProducts(searchParams);

    // Verificar se a resposta da API contém produtos
    if (
      !elektro3Response ||
      elektro3Response.status !== 1 ||
      !elektro3Response.productos ||
      !elektro3Response.productos.length
    ) {
      return res.status(404).json({
        status: "error",
        message: "Nenhum produto encontrado com os parâmetros fornecidos",
      });
    }

    const elektro3Products = elektro3Response.productos;
    console.log(`Encontrados ${elektro3Products.length} produtos na Elektro3`);
    console.log(
      "Amostra do primeiro produto:",
      JSON.stringify(elektro3Products[0]?.nombre || {}, null, 2)
    );

    // Limitar a quantidade de produtos a serem importados
    const productsToImport = elektro3Products.slice(0, limit);
    console.log(`Importando ${productsToImport.length} produtos...`);

    // Array para armazenar resultados da importação
    const importResults = [];

    // Importar cada produto para o Shopify
    for (const elektro3Product of productsToImport) {
      try {
        // Transformar o produto para o formato do Shopify
        const shopifyProduct = {
          title: elektro3Product.nombre || "Produto sem nome",
          body_html: elektro3Product.descripcion || "",
          vendor: elektro3Product.marca || "Elektro3",
          product_type: elektro3Product.categoria || "",
          tags: `${elektro3Product.codigo_familia || ""}, ${
            elektro3Product.subfamilia || ""
          }`.trim(),
          variants: [
            {
              price: elektro3Product.precio?.toString() || "0.00",
              inventory_quantity: elektro3Product.stock || 0,
              requires_shipping: true,
              sku: elektro3Product.codigo || "",
              barcode: elektro3Product.ean13 || "",
            },
          ],
          images: [],
        };

        // Adicionar imagem principal se existir
        if (elektro3Product.imagen) {
          shopifyProduct.images.push({
            src: elektro3Product.imagen,
          });
        }

        // Adicionar imagens adicionais se existirem
        if (
          elektro3Product.imagenes_adicionales &&
          Array.isArray(elektro3Product.imagenes_adicionales)
        ) {
          elektro3Product.imagenes_adicionales.forEach((img) => {
            if (img.imagen) {
              shopifyProduct.images.push({
                src: img.imagen,
              });
            }
          });
        }

        // Criar o produto no Shopify
        const result = await createShopifyProduct(shopifyProduct);

        importResults.push({
          elektro3Id: elektro3Product.codigo,
          shopifyId: result.data.id,
          title: shopifyProduct.title,
          status: "success",
        });

        console.log(`Produto importado com sucesso: ${shopifyProduct.title}`);
      } catch (productError) {
        console.error(
          `Erro ao importar produto ${
            elektro3Product.codigo || "desconhecido"
          }:`,
          productError
        );

        importResults.push({
          elektro3Id: elektro3Product.codigo,
          error: productError.message,
          status: "error",
        });
      }
    }

    // Retornar os resultados da importação
    res.status(200).json({
      status: "success",
      message: `Importação concluída. ${
        importResults.filter((r) => r.status === "success").length
      } produtos importados com sucesso.`,
      total: productsToImport.length,
      success: importResults.filter((r) => r.status === "success").length,
      errors: importResults.filter((r) => r.status === "error").length,
      results: importResults,
    });
  } catch (error) {
    console.error("Erro ao importar produtos:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao importar produtos",
      details: error.message,
    });
  }
});

// Endpoint para testar a conexão com a API da Elektro3
app.get("/elektro3-connection-test", async (req, res) => {
  try {
    // Tentar autenticar com a API da Elektro3
    await elektro3Client.authenticate();
    res.status(200).json({
      status: "success",
      message: "Conexão com a API da Elektro3 estabelecida com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao conectar com a API da Elektro3:", error);
    res.status(500).json({
      status: "error",
      message: "Falha ao conectar com a API da Elektro3",
      details: error.message,
    });
  }
});

// Adicionar suporte ao método POST no endpoint de teste de conexão
app.post("/elektro3-connection-test", async (req, res) => {
  try {
    // Tentar autenticar com a API da Elektro3
    await elektro3Client.authenticate();
    res.status(200).json({
      status: "success",
      message: "Conexão com a API da Elektro3 estabelecida com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao conectar com a API da Elektro3:", error);
    res.status(500).json({
      status: "error",
      message: "Falha ao conectar com a API da Elektro3",
      details: error.message,
    });
  }
});

// Endpoint para testar a conexão com o Shopify
app.get("/shopify-connection-test", async (req, res) => {
  try {
    // Testar a conexão com o Shopify buscando alguns produtos
    const products = await shopify.Product.all({
      session: {
        shop: process.env.SHOPIFY_SHOP.replace(/^https?:\/\//, "").replace(
          /\/$/,
          ""
        ),
        accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      limit: 5, // Buscar apenas 5 produtos para testar
    });

    res.status(200).json({
      status: "success",
      message: "Conexão com o Shopify estabelecida com sucesso!",
      productCount: products.data.length,
      sampleProducts: products.data.map((p) => ({ id: p.id, title: p.title })),
    });
  } catch (error) {
    console.error("Erro ao conectar com o Shopify:", error);
    res.status(500).json({
      status: "error",
      message: "Falha ao conectar com o Shopify",
      details: error.message,
    });
  }
});

// Endpoint para importar um produto específico da Elektro3 para o Shopify
app.post("/import-product/:productId", async (req, res) => {
  try {
    const { productId } = req.params;

    console.log(`Iniciando importação do produto ${productId} da Elektro3...`);

    // Buscar o produto específico da Elektro3
    const elektro3Product = await elektro3Client.getProductById(productId);

    if (!elektro3Product) {
      return res.status(404).json({
        status: "error",
        message: `Produto com ID ${productId} não encontrado na Elektro3`,
      });
    }

    // Transformar o produto para o formato do Shopify
    const shopifyProduct = mapElektro3ProductToShopify(elektro3Product);

    // Criar o produto no Shopify
    const result = await shopify.Product.create({
      session: {
        shop: process.env.SHOPIFY_SHOP.replace(/^https?:\/\//, "").replace(
          /\/$/,
          ""
        ),
        accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      data: shopifyProduct,
    });

    res.status(200).json({
      status: "success",
      message: `Produto "${shopifyProduct.title}" importado com sucesso para o Shopify`,
      elektro3Id: productId,
      shopifyId: result.data.id,
    });
  } catch (error) {
    console.error(`Erro ao importar produto ${req.params.productId}:`, error);
    res.status(500).json({
      status: "error",
      message: `Falha ao importar produto ${req.params.productId}`,
      details: error.message,
    });
  }
});

// Endpoint para listar categorias da Elektro3
app.get("/elektro3-categories", async (req, res) => {
  try {
    // Primeiro autenticar com a API da Elektro3
    await elektro3Client.authenticate();

    // Buscar categorias da API da Elektro3
    const categories = await elektro3Client.getCategories();

    res.status(200).json({
      status: "success",
      message: `${categories.length || 0} categorias encontradas`,
      categories: categories,
    });
  } catch (error) {
    console.error("Erro ao buscar categorias da Elektro3:", error);
    res.status(500).json({
      status: "error",
      message: "Falha ao buscar categorias da Elektro3",
      details: error.message,
    });
  }
});

// Endpoint para importar produtos por categoria
app.post("/import-products-by-category/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    // Limitar quantidade de produtos por importação (opcional)
    const limit = req.body.limit || 20;

    console.log(
      `Iniciando importação de produtos da categoria ${categoryId}...`
    );

    // Buscar produtos da categoria específica
    const elektro3Products = await elektro3Client.getProductsByCategory(
      categoryId
    );

    if (!elektro3Products || elektro3Products.length === 0) {
      return res.status(404).json({
        status: "error",
        message: `Nenhum produto encontrado na categoria ${categoryId}`,
      });
    }

    console.log(
      `Encontrados ${elektro3Products.length} produtos na categoria ${categoryId}`
    );

    // Limitar a quantidade de produtos a serem importados
    const productsToImport = elektro3Products.slice(0, limit);
    console.log(`Importando ${productsToImport.length} produtos...`);

    // Array para armazenar resultados da importação
    const importResults = [];

    // Importar cada produto para o Shopify
    for (const elektro3Product of productsToImport) {
      try {
        // Transformar o produto para o formato do Shopify
        const shopifyProduct = mapElektro3ProductToShopify(elektro3Product);

        // Criar o produto no Shopify
        const result = await shopify.Product.create({
          session: {
            shop: process.env.SHOPIFY_SHOP.replace(/^https?:\/\//, "").replace(
              /\/$/,
              ""
            ),
            accessToken: process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN,
          },
          data: shopifyProduct,
        });

        importResults.push({
          elektro3Id: elektro3Product.id,
          shopifyId: result.data.id,
          title: shopifyProduct.title,
          status: "success",
        });

        console.log(`Produto importado com sucesso: ${shopifyProduct.title}`);
      } catch (productError) {
        console.error(
          `Erro ao importar produto ${elektro3Product.id || "desconhecido"}:`,
          productError
        );

        importResults.push({
          elektro3Id: elektro3Product.id,
          error: productError.message,
          status: "error",
        });
      }
    }

    // Retornar os resultados da importação
    res.status(200).json({
      status: "success",
      message: `Importação de produtos da categoria ${categoryId} concluída`,
      categoryId,
      total: productsToImport.length,
      success: importResults.filter((r) => r.status === "success").length,
      errors: importResults.filter((r) => r.status === "error").length,
      results: importResults,
    });
  } catch (error) {
    console.error(
      `Erro ao importar produtos da categoria ${req.params.categoryId}:`,
      error
    );
    res.status(500).json({
      status: "error",
      message: `Falha ao importar produtos da categoria ${req.params.categoryId}`,
      details: error.message,
    });
  }
});

// Endpoint para testar a estrutura de resposta de produtos da Elektro3
app.get("/elektro3-products-test", async (req, res) => {
  try {
    // Primeiro autenticar com a API da Elektro3
    await elektro3Client.authenticate();

    // Buscar produtos da API da Elektro3 sem filtros
    const response = await elektro3Client.request(
      "post",
      "/api/get-productos",
      {}
    );

    // Analisar e logar a estrutura da resposta
    console.log(
      "Resposta da API Elektro3 (get-productos):",
      JSON.stringify(
        {
          status: response.status,
          hasProductos: !!response.productos,
          productsCount: response.productos ? response.productos.length : 0,
          firstProductSample:
            response.productos && response.productos.length > 0
              ? response.productos[0]
              : null,
          responseKeys: Object.keys(response),
        },
        null,
        2
      )
    );

    // Retornar apenas a estrutura para análise
    res.status(200).json({
      status: "success",
      message: "Estrutura de resposta da API Elektro3",
      responseStructure: {
        status: response.status,
        hasProductos: !!response.productos,
        productsCount: response.productos ? response.productos.length : 0,
        responseKeys: Object.keys(response),
        firstProduct:
          response.productos && response.productos.length > 0
            ? response.productos[0]
            : null,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar produtos da Elektro3:", error);
    res.status(500).json({
      status: "error",
      message: "Falha ao buscar produtos da Elektro3",
      details: error.message,
    });
  }
});

// Basic route
app.get("/", (req, res) => {
  res.send("Elektro3 API Integration App is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`App is running on http://localhost:${PORT}`);
});
