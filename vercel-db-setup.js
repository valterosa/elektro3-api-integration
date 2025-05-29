/**
 * Database setup for Vercel deployment
 * This file prepares the database configuration for production use on Vercel
 */

import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Setting up database configuration for Vercel...");

  try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.log(
        "DATABASE_URL not found. Setting default SQLite for fallback..."
      );
      process.env.DATABASE_URL = "file:dev.sqlite";
    } else {
      console.log(
        "DATABASE_URL configured:",
        process.env.DATABASE_URL.substring(0, 35) + "..."
      );
    }

    console.log("✅ Database configuration complete!");
  } catch (error) {
    console.error("❌ Error setting up database configuration:", error);
    process.exit(1);
  }
}

main();
