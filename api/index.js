// api/index.js
import { createRequestHandler } from "@remix-run/vercel";
import * as build from "@vercel/remix/build";

export default createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (req, res) => {
    return {
      env: process.env,
      req,
      res,
    };
  },
});
