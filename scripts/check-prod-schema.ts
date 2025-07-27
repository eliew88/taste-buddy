/**
 * Production Database Schema Check
 * 
 * Safely check what tables and columns exist in the production database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductionSchema() {
  console.log('🔍 Checking production database schema...\n');

  try {
    // Check if recipe_images table already exists
    try {
      const recipeImagesCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'recipe_images' AND table_schema = 'public';
      `;
      console.log('recipe_images table exists:', (recipeImagesCount as any)[0]?.count > 0);
    } catch (error) {
      console.log('Could not check recipe_images table:', error);
    }

    // Check existing recipes table structure
    try {
      const recipeColumns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'recipes' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      console.log('\nRecipes table columns:');
      console.table(recipeColumns);
    } catch (error) {
      console.log('Could not check recipes table:', error);
    }

    // Check if we can safely read existing recipes
    try {
      const recipeCount = await prisma.recipe.count();
      console.log(`\nTotal recipes in database: ${recipeCount}`);

      if (recipeCount > 0) {
        // Check if any recipes have legacy images
        const recipesWithImages = await prisma.recipe.count({
          where: {
            image: {
              not: null
            }
          }
        });
        console.log(`Recipes with legacy images: ${recipesWithImages}`);
      }
    } catch (error) {
      console.log('Could not check recipes data:', error);
    }

    // Check current migration status
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 5;
      `;
      console.log('\nRecent migrations:');
      console.table(migrations);
    } catch (error) {
      console.log('Could not check migration status:', error);
    }

  } catch (error) {
    console.error('Error checking production schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProductionSchema()
  .then(() => {
    console.log('\n✅ Schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Schema check failed:', error);
    process.exit(1);
  });