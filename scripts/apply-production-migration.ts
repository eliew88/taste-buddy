/**
 * Apply Production Database Migration
 * 
 * SAFELY applies the recipe_images table migration to production
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load production environment variables
dotenv.config({ path: '.env.production' });

// Use the correct production database URL
const prodDatabaseUrl = "postgresql://neondb_owner:npg_NhGBKT2RpOJ0@ep-soft-truth-adue7axh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log('🔗 Connecting to production database...');
console.log('Database URL pattern:', prodDatabaseUrl.replace(/:[^:@]*@/, ':****@'));

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: prodDatabaseUrl
    }
  }
});

async function applyProductionMigration() {
  console.log('🚀 Applying production database migration...\n');

  try {
    // First, check current state
    const recipeCount = await prisma.recipe.count();
    console.log(`📊 Current recipes in production: ${recipeCount}`);

    const recipesWithImages = await prisma.recipe.count({
      where: {
        image: {
          not: null
        }
      }
    });
    console.log(`📸 Recipes with legacy images: ${recipesWithImages}`);

    // Check if recipe_images table already exists
    try {
      const recipeImagesCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_name = 'recipe_images' AND table_schema = 'public';
      `;
      const hasRecipeImages = (recipeImagesCount as any)[0]?.count > 0;
      
      if (hasRecipeImages) {
        console.log('✅ recipe_images table already exists, skipping migration');
        return;
      }
    } catch (error) {
      console.log('❌ Error checking for recipe_images table:', error);
    }

    console.log('\n🔧 Creating recipe_images table...');
    
    // Create the recipe_images table manually (since Prisma migrations aren't set up)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "recipe_images" (
        "id" TEXT NOT NULL,
        "url" TEXT NOT NULL,
        "filename" TEXT,
        "caption" TEXT,
        "alt" TEXT,
        "width" INTEGER,
        "height" INTEGER,
        "fileSize" INTEGER,
        "displayOrder" INTEGER NOT NULL DEFAULT 0,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "recipeId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "recipe_images_pkey" PRIMARY KEY ("id")
      );
    `;

    console.log('✅ recipe_images table created');

    // Create foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "recipe_images" 
      ADD CONSTRAINT "recipe_images_recipeId_fkey" 
      FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `;

    console.log('✅ Foreign key constraint added');

    // Create index for performance
    await prisma.$executeRaw`
      CREATE INDEX "recipe_images_recipeId_idx" ON "recipe_images"("recipeId");
    `;

    console.log('✅ Index created');

    console.log('\n🎉 Production migration completed successfully!');
    console.log('📋 Next step: Run the legacy image migration script');

  } catch (error) {
    console.error('❌ Error applying production migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyProductionMigration()
  .then(() => {
    console.log('\n✅ Production migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Production migration failed:', error);
    process.exit(1);
  });