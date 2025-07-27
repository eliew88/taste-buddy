/**
 * Migration Script: Convert Legacy Single Images to Multiple Images System
 * 
 * This script:
 * 1. Finds all recipes with a legacy image but no images in the new system
 * 2. Creates a RecipeImage entry for each legacy image
 * 3. Marks it as the primary image
 * 
 * Run with: npx tsx prisma/migrate-legacy-images.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateImages() {
  console.log('🚀 Starting legacy image migration...\n');

  try {
    // Find all recipes with legacy images
    const recipesWithLegacyImages = await prisma.recipe.findMany({
      where: {
        image: {
          not: null
        }
      },
      include: {
        images: true
      }
    });

    console.log(`Found ${recipesWithLegacyImages.length} recipes with legacy images\n`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const recipe of recipesWithLegacyImages) {
      try {
        // Skip if recipe already has images in the new system
        if (recipe.images && recipe.images.length > 0) {
          console.log(`⏭️  Skipping recipe "${recipe.title}" - already has ${recipe.images.length} images`);
          skippedCount++;
          continue;
        }

        // Skip if no legacy image
        if (!recipe.image) {
          continue;
        }

        console.log(`📸 Migrating image for recipe: "${recipe.title}"`);

        // Create new RecipeImage entry
        await prisma.recipeImage.create({
          data: {
            recipeId: recipe.id,
            url: recipe.image,
            displayOrder: 0,
            isPrimary: true,
            alt: `${recipe.title} recipe image`,
            // Extract filename from URL if possible
            filename: recipe.image.split('/').pop() || 'legacy-image'
          }
        });

        migratedCount++;
        console.log(`✅ Successfully migrated image for recipe: "${recipe.title}"\n`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Error migrating recipe "${recipe.title}":`, error);
        console.error('');
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} recipes`);
    console.log(`⏭️  Skipped (already had images): ${skippedCount} recipes`);
    console.log(`❌ Errors: ${errorCount} recipes`);
    console.log(`📊 Total processed: ${recipesWithLegacyImages.length} recipes`);

    // Optional: Check if any recipes still only have legacy images
    const remainingLegacyOnly = await prisma.recipe.count({
      where: {
        image: {
          not: null
        },
        images: {
          none: {}
        }
      }
    });

    if (remainingLegacyOnly > 0) {
      console.log(`\n⚠️  Warning: ${remainingLegacyOnly} recipes still only have legacy images`);
    } else {
      console.log('\n🎉 All legacy images have been migrated!');
    }

  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateImages()
  .then(() => {
    console.log('\n✨ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });