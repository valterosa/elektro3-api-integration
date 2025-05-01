// api/[...remix].js
const { createRequestHandler } = require("@vercel/remix/server");
const build = require("../elektro3-api-module/build/server/index.js");

module.exports = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(req, res) {
    return {
      env: process.env
    };
  },
});
