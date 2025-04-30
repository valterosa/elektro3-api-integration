// api/index.js - Ponto de entrada para Vercel Functions
import { createRequestHandler } from "@vercel/remix/api";
import * as build from "../elektro3-api-module/build/server/index.js";

export default createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(req, res) {
    return {
      env: process.env,
    };
  },
});
