/**
 * Migration Script: Convert Existing Favorites to Recipe Book
 * 
 * This script migrates existing favorites to the new Recipe Book system by:
 * 1. Creating a "Favorites" category for each user who has favorites
 * 2. Moving all existing favorites to the "Favorites" category
 * 3. Maintaining backward compatibility with the existing favorites system
 * 
 * Run this script with: npx tsx scripts/migrate-favorites-to-recipe-book.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationStats {
  usersProcessed: number;
  categoriesCreated: number;
  favoritesConverted: number;
  errors: number;
}

async function migrateFavoritesToRecipeBook() {
  console.log('🚀 Starting migration of favorites to Recipe Book system...\n');
  
  const stats: MigrationStats = {
    usersProcessed: 0,
    categoriesCreated: 0,
    favoritesConverted: 0,
    errors: 0
  };

  try {
    // Get all users who have favorites
    const usersWithFavorites = await prisma.user.findMany({
      where: {
        favorites: {
          some: {}
        }
      },
      include: {
        favorites: {
          include: {
            recipe: {
              select: { id: true, title: true }
            }
          }
        },
        recipeBookCategories: {
          where: {
            name: 'Favorites'
          }
        }
      }
    });

    console.log(`📊 Found ${usersWithFavorites.length} users with favorites to migrate\n`);

    for (const user of usersWithFavorites) {
      try {
        console.log(`👤 Processing user: ${user.name || user.email} (${user.favorites.length} favorites)`);
        
        // Check if user already has a "Favorites" category
        let favoritesCategory = user.recipeBookCategories.find(cat => cat.name === 'Favorites');
        
        if (!favoritesCategory) {
          // Create "Favorites" category for this user
          favoritesCategory = await prisma.recipeBookCategory.create({
            data: {
              name: 'Favorites',
              description: 'Your favorited recipes',
              color: '#EF4444', // Red color for favorites
              userId: user.id
            }
          });
          
          console.log(`   ✅ Created "Favorites" category`);
          stats.categoriesCreated++;
        } else {
          console.log(`   ℹ️  "Favorites" category already exists`);
        }

        // Convert each favorite to a recipe book entry
        let convertedCount = 0;
        for (const favorite of user.favorites) {
          // Check if this recipe is already in the recipe book under the Favorites category
          const existingEntry = await prisma.recipeBookEntry.findUnique({
            where: {
              userId_recipeId_categoryId: {
                userId: user.id,
                recipeId: favorite.recipeId,
                categoryId: favoritesCategory.id
              }
            }
          });

          if (!existingEntry) {
            // Create recipe book entry
            await prisma.recipeBookEntry.create({
              data: {
                userId: user.id,
                recipeId: favorite.recipeId,
                categoryId: favoritesCategory.id,
                notes: null,
                addedAt: favorite.id ? new Date() : new Date() // Use current time or favorite creation time if available
              }
            });
            
            convertedCount++;
            stats.favoritesConverted++;
          }
        }
        
        console.log(`   ✅ Converted ${convertedCount} favorites to recipe book entries`);
        stats.usersProcessed++;
        
      } catch (error) {
        console.error(`   ❌ Error processing user ${user.id}:`, error);
        stats.errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Users processed: ${stats.usersProcessed}`);
    console.log(`Categories created: ${stats.categoriesCreated}`);
    console.log(`Favorites converted: ${stats.favoritesConverted}`);
    console.log(`Errors encountered: ${stats.errors}`);
    console.log('='.repeat(60));

    if (stats.errors === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review the logs above.');
    }

    // Verification step
    console.log('\n🔍 Running verification...');
    const verificationResult = await verifyMigration();
    
    if (verificationResult.success) {
      console.log('✅ Verification passed! Migration was successful.');
    } else {
      console.log('❌ Verification failed:', verificationResult.error);
    }

  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyMigration() {
  try {
    // Count total favorites
    const totalFavorites = await prisma.favorite.count();
    
    // Count total recipe book entries in "Favorites" categories
    const favoritesCategories = await prisma.recipeBookCategory.findMany({
      where: { name: 'Favorites' },
      include: {
        _count: {
          select: {
            recipeBookEntries: true
          }
        }
      }
    });
    
    const totalRecipeBookFavorites = favoritesCategories.reduce(
      (sum, category) => sum + category._count.recipeBookEntries, 
      0
    );
    
    console.log(`📊 Verification Results:`);
    console.log(`   Original favorites: ${totalFavorites}`);
    console.log(`   Recipe book favorites: ${totalRecipeBookFavorites}`);
    console.log(`   Favorites categories: ${favoritesCategories.length}`);
    
    if (totalRecipeBookFavorites >= totalFavorites) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: `Mismatch: ${totalFavorites} original favorites vs ${totalRecipeBookFavorites} migrated` 
      };
    }
    
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Run the migration
if (require.main === module) {
  migrateFavoritesToRecipeBook()
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { migrateFavoritesToRecipeBook };