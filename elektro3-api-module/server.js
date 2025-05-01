// server.js para Vercel - usando CommonJS para compatibilidade
const { createRequestHandler } = require("@vercel/remix/server");

// Importar o build de maneira compatível com ambiente de produção
const build = require("./build/server/index.js");

// Certifique-se de definir o ambiente correto
const mode = process.env.NODE_ENV || "production";

module.exports = createRequestHandler({
  build,
  mode,
  getLoadContext(req, res) {
    return {
      env: process.env,
    };
  },
});
