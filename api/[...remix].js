// api/[...remix].js
const path = require("path");
const { createRequestHandler } = require("@vercel/remix/server");

// Ajuste do caminho para o diretório de build, que agora está em elektro3-api-module/build
const BUILD_DIR = path.join(process.cwd(), "elektro3-api-module/build");

// Importando o build do servidor
const build = require(path.join(BUILD_DIR, "server/index.js"));

module.exports = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(req, res) {
    return {
      env: process.env,
    };
  },
});

// Export default para compatibilidade com Vercel
module.exports.default = module.exports;
