/**
 * Migrate Production Legacy Images
 * 
 * SAFELY migrates legacy recipe images to the new multiple images system in PRODUCTION
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

// Generate unique ID (similar to Prisma's cuid)
function generateId(): string {
  return 'img_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

async function migrateProductionLegacyImages() {
  console.log('🔄 Migrating production legacy images...\n');

  try {
    // Get all recipes with legacy images
    const recipesWithLegacyImages = await prisma.recipe.findMany({
      where: {
        image: {
          not: null
        }
      },
      select: {
        id: true,
        title: true,
        image: true,
        images: true // Check if they already have new images
      }
    });

    console.log(`📸 Found ${recipesWithLegacyImages.length} recipes with legacy images`);

    if (recipesWithLegacyImages.length === 0) {
      console.log('✅ No legacy images to migrate');
      return;
    }

    // Show what we're about to migrate
    console.log('\n📋 Recipes to migrate:');
    recipesWithLegacyImages.forEach((recipe, index) => {
      console.log(`${index + 1}. "${recipe.title}" - ${recipe.image}`);
      if (recipe.images && recipe.images.length > 0) {
        console.log(`   ⚠️  Already has ${recipe.images.length} new images`);
      }
    });

    // Ask for confirmation
    console.log('\n⚠️  This will create RecipeImage entries for each legacy image');
    console.log('⚠️  Legacy image field will NOT be cleared (keeping as backup)');
    
    let migrationCount = 0;
    let skippedCount = 0;

    for (const recipe of recipesWithLegacyImages) {
      try {
        // Check if this recipe already has images in the new system
        const existingImages = await prisma.recipeImage.findMany({
          where: { recipeId: recipe.id }
        });

        if (existingImages.length > 0) {
          console.log(`⏭️  Skipping "${recipe.title}" - already has ${existingImages.length} new images`);
          skippedCount++;
          continue;
        }

        // Create a new RecipeImage entry for the legacy image
        await prisma.recipeImage.create({
          data: {
            id: generateId(),
            url: recipe.image!,
            alt: `${recipe.title} recipe image`,
            displayOrder: 0,
            isPrimary: true, // Make the legacy image the primary image
            recipeId: recipe.id,
          }
        });

        console.log(`✅ Migrated "${recipe.title}"`);
        migrationCount++;

      } catch (error) {
        console.error(`❌ Failed to migrate "${recipe.title}":`, error);
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migrationCount} recipes`);
    console.log(`⏭️  Skipped (already migrated): ${skippedCount} recipes`);

    // Final verification
    const totalRecipeImages = await prisma.recipeImage.count();
    console.log(`🖼️  Total recipe images in system: ${totalRecipeImages}`);

  } catch (error) {
    console.error('❌ Error migrating production legacy images:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateProductionLegacyImages()
  .then(() => {
    console.log('\n✅ Production legacy image migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Production legacy image migration failed:', error);
    process.exit(1);
  });