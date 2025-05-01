// api/[...remix].js
const { createRequestHandler } = require("@vercel/remix/server");

// Importar build diretamente do pacote @remix-run/dev
const build = require("@remix-run/dev/server-build");

module.exports = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(req, res) {
    return {
      env: process.env,
    };
  },
});

// Export a default handler for Vercel
module.exports.default = module.exports;
