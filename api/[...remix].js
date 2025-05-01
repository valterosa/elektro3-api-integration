// api/[...remix].js
const path = require("path");
const { createRequestHandler } = require("@vercel/remix/server");

// O caminho correto para o arquivo de build do servidor
const BUILD_DIR = path.join(process.cwd(), "elektro3-api-module/build");

// Observe que importamos diretamente do arquivo gerado, não do pacote
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
