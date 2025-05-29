// api/index.js
import { createRequestHandler } from "@vercel/remix/server";

// Para produção no Vercel, usar o build compilado
import * as build from "../build/server/index.js";

export default createRequestHandler({
  build,
  mode: process.env.NODE_ENV || "production",
  getLoadContext: (req, res) => {
    return {
      env: process.env,
      req,
      res,
    };
  },
});
