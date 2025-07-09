#!/usr/bin/env node

/**
 * Production Database Migration Script
 * 
 * This script applies the necessary schema changes to the production database
 * to match our current Prisma schema with structured ingredients.
 */

const { execSync } = require('child_process');

async function main() {
  try {
    console.log('🚀 Starting production database migration...');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    console.log('📊 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🔄 Applying database migrations...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('🌱 Seeding database with sample data...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    
    console.log('✅ Production migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();