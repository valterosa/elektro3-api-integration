// server.js para Vercel
import { createRequestHandler } from "@vercel/remix/server";
import * as build from "./build/server/index.js";

// Certifique-se de definir o ambiente correto
const mode = process.env.NODE_ENV;

export default createRequestHandler({
  build,
  mode,
  getLoadContext(req, res) {
    return {
      env: process.env,
    };
  },
});
