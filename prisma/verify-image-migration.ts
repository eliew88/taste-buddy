/**
 * Verification Script: Check Legacy Image Migration Status
 * 
 * This script provides statistics about:
 * - Recipes with only legacy images
 * - Recipes with only new images
 * - Recipes with both
 * - Recipes with no images
 * 
 * Run with: npx tsx prisma/verify-image-migration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Analyzing image migration status...\n');

  try {
    // Get all recipes with their image data
    const allRecipes = await prisma.recipe.findMany({
      include: {
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: {
            images: true
          }
        }
      }
    });

    // Categorize recipes
    const stats = {
      total: allRecipes.length,
      noImages: 0,
      legacyOnly: 0,
      newOnly: 0,
      both: 0,
      primaryImageCount: 0
    };

    const legacyOnlyRecipes: string[] = [];
    const noImageRecipes: string[] = [];

    for (const recipe of allRecipes) {
      const hasLegacy = !!recipe.image;
      const hasNew = recipe._count.images > 0;
      const hasPrimary = recipe.images.some(img => img.isPrimary);

      if (!hasLegacy && !hasNew) {
        stats.noImages++;
        noImageRecipes.push(recipe.title);
      } else if (hasLegacy && !hasNew) {
        stats.legacyOnly++;
        legacyOnlyRecipes.push(recipe.title);
      } else if (!hasLegacy && hasNew) {
        stats.newOnly++;
      } else if (hasLegacy && hasNew) {
        stats.both++;
      }

      if (hasPrimary) {
        stats.primaryImageCount++;
      }
    }

    // Display results
    console.log('📊 Recipe Image Statistics:');
    console.log('===========================');
    console.log(`Total recipes: ${stats.total}`);
    console.log(`\n📷 Image System Usage:`);
    console.log(`  - No images at all: ${stats.noImages} (${((stats.noImages / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  - Legacy image only: ${stats.legacyOnly} (${((stats.legacyOnly / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  - New images only: ${stats.newOnly} (${((stats.newOnly / stats.total) * 100).toFixed(1)}%)`);
    console.log(`  - Both systems: ${stats.both} (${((stats.both / stats.total) * 100).toFixed(1)}%)`);
    console.log(`\n✅ Recipes with primary image set: ${stats.primaryImageCount}`);

    // Show recipes that need migration
    if (legacyOnlyRecipes.length > 0) {
      console.log('\n⚠️  Recipes that still need migration:');
      legacyOnlyRecipes.forEach(title => {
        console.log(`  - ${title}`);
      });
      console.log('\nRun the migration script to convert these legacy images.');
    } else {
      console.log('\n🎉 All recipes with images have been migrated to the new system!');
    }

    // Show recipes with no images
    if (noImageRecipes.length > 0) {
      console.log('\n📭 Recipes with no images:');
      noImageRecipes.forEach(title => {
        console.log(`  - ${title}`);
      });
    }

    // Note: Orphaned image check not needed since recipeId is required in schema

  } catch (error) {
    console.error('Error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyMigration()
  .then(() => {
    console.log('\n✨ Verification completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Verification failed:', error);
    process.exit(1);
  });