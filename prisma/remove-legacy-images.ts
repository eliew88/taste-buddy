/**
 * Cleanup Script: Remove Legacy Image Fields
 * 
 * This script:
 * 1. Finds all recipes that have images in the new system
 * 2. Removes the legacy image field from those recipes
 * 3. Provides a safety check before proceeding
 * 
 * Run with: npx tsx prisma/remove-legacy-images.ts
 * 
 * Add --force flag to skip confirmation: npx tsx prisma/remove-legacy-images.ts --force
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Check if --force flag was provided
const forceMode = process.argv.includes('--force');

function askConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question + ' (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function removeLegacyImages() {
  console.log('🧹 Legacy Image Cleanup Script\n');

  try {
    // First, get statistics
    const recipesWithBoth = await prisma.recipe.findMany({
      where: {
        AND: [
          {
            image: {
              not: null
            }
          },
          {
            images: {
              some: {}
            }
          }
        ]
      },
      include: {
        images: {
          orderBy: { displayOrder: 'asc' }
        }
      }
    });

    const recipesWithLegacyOnly = await prisma.recipe.count({
      where: {
        AND: [
          {
            image: {
              not: null
            }
          },
          {
            images: {
              none: {}
            }
          }
        ]
      }
    });

    console.log('📊 Current Status:');
    console.log(`  - Recipes with both legacy and new images: ${recipesWithBoth.length}`);
    console.log(`  - Recipes with ONLY legacy images: ${recipesWithLegacyOnly}`);

    if (recipesWithLegacyOnly > 0) {
      console.log('\n⚠️  WARNING: There are still recipes with ONLY legacy images!');
      console.log('Run the migration script first to avoid losing images.\n');
      process.exit(1);
    }

    if (recipesWithBoth.length === 0) {
      console.log('\n✅ No recipes have legacy images to remove. Cleanup complete!');
      process.exit(0);
    }

    // Show which recipes will be affected
    console.log('\n📋 Recipes that will have legacy images removed:');
    recipesWithBoth.forEach(recipe => {
      const primaryImage = recipe.images.find(img => img.isPrimary);
      console.log(`  - ${recipe.title}`);
      console.log(`    Legacy: ${recipe.image}`);
      console.log(`    Primary: ${primaryImage?.url || recipe.images[0]?.url}`);
      console.log(`    Total images in new system: ${recipe.images.length}`);
      console.log('');
    });

    // Ask for confirmation unless --force flag is used
    if (!forceMode) {
      const confirmed = await askConfirmation(
        `\nThis will remove the legacy image field from ${recipesWithBoth.length} recipes. Continue?`
      );

      if (!confirmed) {
        console.log('\n❌ Operation cancelled by user.');
        process.exit(0);
      }
    }

    console.log('\n🔄 Removing legacy images...');

    let successCount = 0;
    let errorCount = 0;

    // Process each recipe
    for (const recipe of recipesWithBoth) {
      try {
        await prisma.recipe.update({
          where: { id: recipe.id },
          data: { image: null }
        });
        
        successCount++;
        console.log(`✅ Removed legacy image from: ${recipe.title}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing recipe "${recipe.title}":`, error);
      }
    }

    // Final summary
    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ Successfully cleaned: ${successCount} recipes`);
    console.log(`❌ Errors: ${errorCount} recipes`);

    // Verify final state
    const remainingLegacyImages = await prisma.recipe.count({
      where: {
        image: {
          not: null
        }
      }
    });

    console.log(`\n📷 Remaining recipes with legacy images: ${remainingLegacyImages}`);

    if (remainingLegacyImages === 0) {
      console.log('\n🎉 All legacy images have been successfully removed!');
      console.log('The image field can now be safely removed from the schema.');
    }

  } catch (error) {
    console.error('Fatal error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
removeLegacyImages()
  .then(() => {
    console.log('\n✨ Cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });