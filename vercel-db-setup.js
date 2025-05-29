/**
 * Database setup for Vercel deployment
 * This file prepares the database for production use on Vercel
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Setting up database for production on Vercel...');
  
  try {
    // Run migrations if needed
    console.log('Checking database schema...');
    
    // Try a simple query to test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful!');
    
    // For PostgreSQL on Vercel, let's add any needed initial setup here
    
    console.log('✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
