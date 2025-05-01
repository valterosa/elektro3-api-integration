import { createRequestHandler } from "@vercel/remix/server";
import * as build from "@remix-run/dev/server-build";

export default createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext(req, res) {
    return {
      env: process.env,
    };
  },
});

// Export a default handler for Vercel
export const config = {
  runtime: "nodejs",
};
