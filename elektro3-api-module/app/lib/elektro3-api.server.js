/**
 * Serviço para comunicação com a API da Elektro3
 * Este arquivo contém funções para buscar produtos e categorias da API da Elektro3
 */

// Configurações da API Elektro3
const ELEKTRO3_API_URL =
  process.env.ELEKTRO3_API_URL || "https://api.elektro3.com";
const ELEKTRO3_CLIENT_ID = process.env.ELEKTRO3_CLIENT_ID;
const ELEKTRO3_SECRET_KEY = process.env.ELEKTRO3_SECRET_KEY;
const ELEKTRO3_USERNAME = process.env.ELEKTRO3_USERNAME;
const ELEKTRO3_PASSWORD = process.env.ELEKTRO3_PASSWORD;

// Logs para depuração
console.log("Elektro3 API URL:", ELEKTRO3_API_URL);
console.log("Elektro3 credentials configured:", {
  hasClientId: !!ELEKTRO3_CLIENT_ID,
  hasSecretKey: !!ELEKTRO3_SECRET_KEY,
  hasUsername: !!ELEKTRO3_USERNAME,
  hasPassword: !!ELEKTRO3_PASSWORD,
});

/**
 * Autenticar na API da Elektro3
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
        "Missing Elektro3 API credentials. Please check your environment variables.",
      );
    }

    console.log(
      "Attempting to authenticate with Elektro3 API at:",
      `${ELEKTRO3_API_URL}/auth`,
    );

    // Tentativa principal com endpoint /auth
    try {
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
        console.log("Authentication successful with /auth endpoint");
        return data.accessToken;
      }

      console.log(
        "First authentication attempt failed, status:",
        response.status,
        response.statusText,
      );
      // Se a primeira tentativa falhar, não lance erro ainda, tente o formato alternativo
    } catch (err) {
      console.log("Error with first authentication attempt:", err.message);
      // Continue para a próxima tentativa
    }

    // Segunda tentativa com endpoint /api/auth (formato comum em APIs)
    try {
      console.log("Attempting alternative endpoint: /api/auth");
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
        console.log("Authentication successful with /api/auth endpoint");
        return data.accessToken;
      }

      console.log(
        "Second authentication attempt failed, status:",
        response.status,
        response.statusText,
      );
    } catch (err) {
      console.log("Error with second authentication attempt:", err.message);
    }

    // Terceira tentativa com formato de corpo alternativo (alguns sistemas usam nomes de campos diferentes)
    try {
      console.log("Attempting with alternative request body format");
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
        console.log("Authentication successful with alternative body format");
        return data.accessToken;
      }

      console.log(
        "Third authentication attempt failed, status:",
        response.status,
        response.statusText,
      );
    } catch (err) {
      console.log("Error with third authentication attempt:", err.message);
    }

    // Se todas as tentativas falharem, lance um erro detalhado
    throw new Error(
      "Failed to authenticate with Elektro3 API after multiple attempts. Please check API URL and credentials.",
    );
  } catch (error) {
    console.error("Error authenticating with Elektro3 API:", error);
    throw error;
  }
}

/**
 * Buscar produtos da API da Elektro3 com filtros
 * @param {Object} options Opções de filtro
 * @param {string} options.category Categoria dos produtos
 * @param {string} options.query Termo de busca
 * @param {boolean} options.inStock Filtrar por produtos em estoque
 * @param {number} options.page Página atual
 * @param {number} options.limit Limite de produtos por página
 * @returns {Promise<Object>} Produtos, categorias e total de produtos
 */
export async function fetchProductsFromElektro3API(options = {}) {
  try {
    const token = await authenticate();

    // Construir a URL com os parâmetros de consulta
    const params = new URLSearchParams();

    if (options.category) params.append("codigo_categoria", options.category);
    if (options.query) params.append("search", options.query);
    if (options.inStock) params.append("stock_gt", "0");

    params.append("page", options.page || 1);
    params.append("limit", options.limit || 20);

    // Buscar produtos
    const productsResponse = await fetch(
      `${ELEKTRO3_API_URL}/products?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!productsResponse.ok) {
      throw new Error(
        `Failed to fetch products: ${productsResponse.statusText}`,
      );
    }

    const productsData = await productsResponse.json();

    // Buscar categorias simultaneamente
    const categoriesResponse = await fetch(`${ELEKTRO3_API_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!categoriesResponse.ok) {
      throw new Error(
        `Failed to fetch categories: ${categoriesResponse.statusText}`,
      );
    }

    const categoriesData = await categoriesResponse.json();

    return {
      products: productsData.data || [],
      categories: categoriesData.data || [],
      totalProducts: productsData.total || 0,
    };
  } catch (error) {
    console.error("Error fetching data from Elektro3 API:", error);
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

    const response = await fetch(
      `${ELEKTRO3_API_URL}/products/${productCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch product details: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching product details for ${productCode}:`, error);
    throw error;
  }
}

/**
 * Obter todas as categorias da API da Elektro3
 * @returns {Promise<Array>} Lista de categorias
 */
export async function fetchCategories() {
  try {
    const token = await authenticate();

    const response = await fetch(`${ELEKTRO3_API_URL}/categories`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}
