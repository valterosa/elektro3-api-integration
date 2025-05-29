// api/index.js
import { createRequestHandler } from "@vercel/remix/server";

// Para produção no Vercel, usar o build compilado
import * as build from "../build/server/index.js";

export default createRequestHandler({
  build,
  mode: process.env.NODE_ENV || "production",
  getLoadContext: (req, res) => {
    // Add headers for Shopify app bridge
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // For Shopify webhook validation
    if (req.method === 'POST' && req.url.includes('/webhooks/')) {
      res.setHeader('Content-Type', 'application/json');
    }
    
    return {
      env: process.env,
      req,
      res,
    };
  },
});
