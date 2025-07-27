/**
 * Production Database Schema Check
 * 
 * Safely check what tables and columns exist in the PRODUCTION database
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env.production' });

// Use the correct production database URL
const prodDatabaseUrl = "postgresql://neondb_owner:npg_NhGBKT2RpOJ0@ep-soft-truth-adue7axh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

if (!prodDatabaseUrl) {
  console.error('❌ No DATABASE_URL found in .env.production');
  process.exit(1);
}

console.log('🔗 Connecting to production database...');
console.log('Database URL pattern:', prodDatabaseUrl.replace(/:[^:@]*@/, ':****@'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: prodDatabaseUrl
    }
  }
});

async function checkProductionSchema() {
  console.log('🔍 Checking PRODUCTION database schema...\n');

  try {
    // Check if recipe_images table already exists
    try {
      const recipeImagesCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'recipe_images' AND table_schema = 'public';
      `;
      const hasRecipeImages = (recipeImagesCount as any)[0]?.count > 0;
      console.log('✅ recipe_images table exists:', hasRecipeImages);
    } catch (error) {
      console.log('❌ Could not check recipe_images table:', error);
    }

    // Check existing recipes table structure
    try {
      const recipeColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'recipes' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      console.log('\n📋 Recipes table columns:');
      console.table(recipeColumns);
    } catch (error) {
      console.log('❌ Could not check recipes table:', error);
    }

    // Check if we can safely read existing recipes
    try {
      const recipeCount = await prisma.recipe.count();
      console.log(`\n📊 Total recipes in PRODUCTION database: ${recipeCount}`);

      if (recipeCount > 0) {
        // Check if any recipes have legacy images
        const recipesWithImages = await prisma.recipe.count({
          where: {
            image: {
              not: null
            }
          }
        });
        console.log(`📸 Recipes with legacy images: ${recipesWithImages}`);
        
        // Check if we have any recipe images already
        try {
          const recipeImagesCount = await prisma.recipeImage.count();
          console.log(`🖼️  Existing recipe images: ${recipeImagesCount}`);
        } catch (error) {
          console.log('❌ Could not check recipe images (table may not exist yet)');
        }
      }
    } catch (error) {
      console.log('❌ Could not check recipes data:', error);
    }

    // Check current migration status
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 10;
      `;
      console.log('\n🚀 Recent migrations:');
      console.table(migrations);
    } catch (error) {
      console.log('❌ Could not check migration status:', error);
    }

  } catch (error) {
    console.error('❌ Error checking production schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionSchema()
  .then(() => {
    console.log('\n✅ PRODUCTION schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ PRODUCTION schema check failed:', error);
    process.exit(1);
  });