const axios = require("axios");

class Elektro3Api {
  constructor(config) {
    this.clientId = config.clientId;
    this.secretKey = config.secretKey;
    this.username = config.username;
    this.password = config.password;
    this.baseUrl = config.baseUrl || "https://api.elektro3.com"; // URL base da API (ajuste conforme necessário)
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.secretKey,
        username: this.username,
        password: this.password,
        grant_type: "password",
      });

      this.token = response.data.access_token;
      // Calcular a expiração do token (geralmente 1 hora)
      const expiresIn = response.data.expires_in || 3600;
      this.tokenExpiry = Date.now() + expiresIn * 1000;

      return this.token;
    } catch (error) {
      console.error(
        "Erro na autenticação com a API Elektro3:",
        error.response?.data || error.message
      );
      throw new Error("Falha na autenticação com a API Elektro3");
    }
  }

  async getAuthToken() {
    // Verificar se o token ainda é válido
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }

    return this.token;
  }

  async request(method, endpoint, data = null) {
    try {
      const token = await this.getAuthToken();

      const config = {
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      if (data && (method === "post" || method === "put")) {
        config.data = data;
      } else if (data) {
        config.params = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(
        "Erro na requisição para a API Elektro3:",
        error.response?.data || error.message
      );
      throw new Error(
        `Falha na requisição para a API Elektro3: ${error.message}`
      );
    }
  }

  // Métodos específicos para interagir com a API
  async getProducts(params = {}) {
    try {
      console.log(
        "Chamando API da Elektro3 para obter produtos com parâmetros:",
        JSON.stringify(params)
      );
      const response = await this.request("post", "/api/get-productos", params);
      console.log(
        "Resposta da API Elektro3 (get-productos) - Status:",
        response.status
      );
      console.log("Total de produtos encontrados:", response.total_items || 0);

      // Retorna o objeto de resposta completo
      return response;
    } catch (error) {
      console.error("Erro ao obter produtos da Elektro3:", error);
      throw error;
    }
  }

  async getProductById(productId) {
    return this.request("post", "/api/get-producto", { id: productId });
  }

  async getCategories(params = {}) {
    return this.request("post", "/api/get-categorias", params);
  }

  async getCategoryById(categoryId) {
    return this.request("post", "/api/get-categorias", { id: categoryId });
  }
}

module.exports = Elektro3Api;
