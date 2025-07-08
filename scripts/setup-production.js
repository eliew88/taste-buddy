#!/usr/bin/env node

/**
 * Production Setup Script
 * 
 * Run this script to set up your production database and verify everything is working.
 * Usage: node scripts/setup-production.js
 */

const { execSync } = require('child_process');

console.log('🚀 TasteBuddy Production Setup');
console.log('===============================\n');

// Check if DATABASE_URL is provided
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  console.log('\n📋 To fix this:');
  console.log('1. Go to your Vercel dashboard → Storage → Create Postgres Database');
  console.log('2. Copy the connection string');
  console.log('3. Run: DATABASE_URL="your-connection-string" node scripts/setup-production.js');
  process.exit(1);
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  console.error('❌ ERROR: DATABASE_URL must start with postgresql:// or postgres://');
  console.log('Current DATABASE_URL protocol:', databaseUrl.split('://')[0]);
  process.exit(1);
}

console.log('✅ DATABASE_URL is properly formatted');
console.log('Database protocol:', databaseUrl.split('://')[0]);

try {
  console.log('\n📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('\n🏗️  Pushing database schema...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('\n🌱 Seeding database with demo data...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  
  console.log('\n✅ Production setup complete!');
  console.log('\n📋 Demo accounts available:');
  console.log('- sarah@example.com (password: demo)');
  console.log('- mike@example.com (password: demo)');
  console.log('- david@example.com (password: demo)');
  console.log('- emily@example.com (password: demo)');
  
} catch (error) {
  console.error('\n❌ Setup failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Verify your DATABASE_URL is correct');
  console.log('2. Ensure your database is accessible');
  console.log('3. Check Vercel environment variables');
  process.exit(1);
}