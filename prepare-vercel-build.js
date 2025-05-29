// prepare-vercel-build.js
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

console.log("Preparing build files for Vercel deployment...");

try {
  const serverIndexPath = resolve("build/server/index.js");
  const serverMjsPath = resolve("build/server/server-index.mjs");

  if (existsSync(serverIndexPath)) {
    copyFileSync(serverIndexPath, serverMjsPath);
    console.log(
      "✅ Copied build/server/index.js to build/server/server-index.mjs"
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
