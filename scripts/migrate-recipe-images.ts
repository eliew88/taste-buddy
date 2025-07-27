#!/usr/bin/env tsx

/**
 * Data Migration Script: Migrate Recipe Images
 * 
 * This script migrates existing Recipe.image fields to the new RecipeImage table.
 * Each existing image becomes the primary image for that recipe.
 * 
 * Usage: npx tsx scripts/migrate-recipe-images.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRecipeImages() {
  console.log('🚀 Starting recipe image migration...');
  
  try {
    // Get all recipes that have an image but no RecipeImage records
    const recipesWithImages = await prisma.recipe.findMany({
      where: {
        image: {
          not: null,
        },
        images: {
          none: {}
        }
      },
      select: {
        id: true,
        image: true,
        title: true,
      }
    });

    console.log(`📊 Found ${recipesWithImages.length} recipes with images to migrate`);

    if (recipesWithImages.length === 0) {
      console.log('✅ No images to migrate. All done!');
      return;
    }

    let migratedCount = 0;
    let errorCount = 0;

    for (const recipe of recipesWithImages) {
      try {
        // Create a RecipeImage record for the existing image
        await prisma.recipeImage.create({
          data: {
            url: recipe.image!,
            filename: recipe.image!.split('/').pop() || 'unknown',
            recipeId: recipe.id,
            displayOrder: 0,
            isPrimary: true, // This becomes the primary image
            alt: `${recipe.title} recipe image`,
          }
        });

        migratedCount++;
        console.log(`✅ Migrated image for recipe: ${recipe.title}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to migrate image for recipe ${recipe.title}:`, error);
      }
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} images`);
    console.log(`   ❌ Failed to migrate: ${errorCount} images`);
    console.log(`   📊 Total processed: ${recipesWithImages.length} recipes`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some images failed to migrate. Please check the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All recipe images migrated successfully!');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateRecipeImages()
    .then(() => {
      console.log('✨ Migration completed');
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateRecipeImages };