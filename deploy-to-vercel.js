/**
 * Deployment script for Vercel
 * This script helps prepare the app for deployment to Vercel
 */

const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

// Ensure the environment is set correctly for production
process.env.NODE_ENV = "production";

console.log("🚀 Preparing for Vercel deployment...");

// Verify environment variables
const requiredVars = [
  "SHOPIFY_API_KEY",
  "SHOPIFY_API_SECRET",
  "SHOPIFY_APP_URL",
  "SCOPES",
];

const missingVars = requiredVars.filter((varName) => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(
    `❌ Missing required environment variables: ${missingVars.join(", ")}`
  );
  console.error(
    "Please set these variables in your Vercel project before deploying."
  );
  process.exit(1);
}

try {
  // Run Prisma generate to ensure the Prisma client is built
  console.log("📦 Generating Prisma client...");
  execSync("npx prisma generate", { stdio: "inherit" });

  // Run the build process
  console.log("🏗️ Building the application...");
  execSync("npm run build", { stdio: "inherit" });

  console.log("✅ Build successful!");
  console.log("🔄 Ready to deploy to Vercel!");

  console.log("\n📝 Next steps:");
  console.log("1. Commit and push these changes to your GitHub repository");
  console.log("2. Connect your repository to Vercel");
  console.log(`3. Set the following environment variables in Vercel:
   - SHOPIFY_API_KEY
   - SHOPIFY_API_SECRET
   - SHOPIFY_APP_URL (your Vercel deployment URL)
   - SCOPES
   - ELEKTRO3_API_URL
   - ELEKTRO3_CLIENT_ID
   - ELEKTRO3_SECRET_KEY
   - ELEKTRO3_USERNAME
   - ELEKTRO3_PASSWORD
  `);
} catch (error) {
  console.error("❌ Error during deployment preparation:", error);
  process.exit(1);
}
