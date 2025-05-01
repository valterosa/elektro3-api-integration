// api/index.js
const { createRequestHandler } = require("@vercel/remix/server");

// Importar build diretamente do pacote @remix-run/dev
const build = require("@remix-run/dev/server-build");

const handler = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(req, res) {
    return {
      env: process.env,
    };
  },
});

module.exports = handler;
module.exports.default = handler;
