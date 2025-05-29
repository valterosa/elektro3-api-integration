// prepare-vercel-build.js
import { writeFileSync, existsSync } from "fs";
import { resolve } from "path";

console.log("Preparing build files for Vercel deployment...");

try {
  const serverIndexPath = resolve("build/server/index.js");
  const serverMjsPath = resolve("build/server/server-index.mjs");

  if (existsSync(serverIndexPath)) {    // Create a proper server handler for Vercel
    const serverHandlerContent = `// Auto-generated server handler for Vercel
import { createRequestHandler } from "@remix-run/node";
import * as serverBuild from "./index.js";

export default createRequestHandler({ build: serverBuild });
`;

    writeFileSync(serverMjsPath, serverHandlerContent);
    console.log(
      "✅ Created proper server handler at build/server/server-index.mjs"
    );
  } else {
    console.error("❌ build/server/index.js not found");
    process.exit(1);
  }

  console.log("✅ Vercel build preparation complete!");
} catch (error) {
  console.error("❌ Error preparing Vercel build:", error);
  process.exit(1);
}
