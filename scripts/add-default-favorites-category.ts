/**
 * Migration script to add default "Favorites" category to all existing users
 * 
 * This ensures all users have a Favorites category in their Recipe Book
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDefaultFavoritesCategory() {
  console.log('🚀 Starting migration: Adding default Favorites category to all users...');
  
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        recipeBookCategories: {
          where: { name: 'Favorites' },
          select: { id: true }
        }
      }
    });

    console.log(`📊 Found ${users.length} users to process`);

    let categoriesCreated = 0;
    let usersSkipped = 0;

    // Process each user
    for (const user of users) {
      // Check if user already has a Favorites category
      if (user.recipeBookCategories.length > 0) {
        console.log(`⏭️  User ${user.name || user.email} already has Favorites category`);
        usersSkipped++;
        continue;
      }

      // Create Favorites category for user
      try {
        await prisma.recipeBookCategory.create({
          data: {
            userId: user.id,
            name: 'Favorites',
            description: 'My favorite recipes',
            color: '#EF4444', // Red heart color
          }
        });
        categoriesCreated++;
        console.log(`✅ Created Favorites category for ${user.name || user.email}`);
      } catch (error) {
        console.error(`❌ Error creating category for ${user.name || user.email}:`, error);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`  - Total users processed: ${users.length}`);
    console.log(`  - Favorites categories created: ${categoriesCreated}`);
    console.log(`  - Users skipped (already had category): ${usersSkipped}`);
    
    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addDefaultFavoritesCategory()
  .then(() => {
    console.log('🎉 Migration script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });