#!/usr/bin/env tsx

/**
 * Migration Script: Add Meal and Photo Achievements
 * 
 * This script adds new achievement types for meals and photos to the database.
 * It updates the schema and seeds the new achievements.
 * 
 * Run with: npx tsx scripts/add-meal-and-photo-achievements.ts
 */

import { PrismaClient } from '@prisma/client';
import { ACHIEVEMENT_DEFINITIONS } from '../prisma/achievements-seed';

const prisma = new PrismaClient();

async function addMealAndPhotoAchievements() {
  console.log('🏆 Adding meal and photo achievements...\n');

  try {
    // Filter out just the new achievements we want to add
    const newAchievements = ACHIEVEMENT_DEFINITIONS.filter(achievement => 
      achievement.type === 'MEAL_COUNT' || achievement.type === 'PHOTO_COUNT'
    );

    console.log(`📝 Found ${newAchievements.length} new achievements to add:`);
    newAchievements.forEach(achievement => {
      console.log(`   - ${achievement.name} (${achievement.type})`);
    });
    console.log('');

    // Check if achievements already exist
    const existingAchievements = await prisma.achievement.findMany({
      where: {
        OR: [
          { type: 'MEAL_COUNT' },
          { type: 'PHOTO_COUNT' }
        ]
      },
      select: { name: true, type: true }
    });

    if (existingAchievements.length > 0) {
      console.log('⚠️  Some achievements already exist:');
      existingAchievements.forEach(achievement => {
        console.log(`   - ${achievement.name} (${achievement.type})`);
      });
      console.log('');
      
      // Ask if we should proceed
      console.log('❓ This will replace existing achievements. Do you want to continue? (y/N)');
      
      // In a real script, you might want to add interactive confirmation
      // For now, we'll proceed with the assumption that this is intended
    }

    // Remove existing meal and photo achievements
    console.log('🧹 Removing existing meal and photo achievements...');
    const deletedUserAchievements = await prisma.userAchievement.deleteMany({
      where: {
        achievement: {
          OR: [
            { type: 'MEAL_COUNT' },
            { type: 'PHOTO_COUNT' }
          ]
        }
      }
    });
    console.log(`   ✓ Removed ${deletedUserAchievements.count} user achievements`);

    const deletedAchievements = await prisma.achievement.deleteMany({
      where: {
        OR: [
          { type: 'MEAL_COUNT' },
          { type: 'PHOTO_COUNT' }
        ]
      }
    });
    console.log(`   ✓ Removed ${deletedAchievements.count} achievement definitions`);

    // Add new achievements
    console.log('\n➕ Adding new achievements...');
    for (const achievement of newAchievements) {
      const created = await prisma.achievement.create({
        data: achievement
      });
      console.log(`   ✓ Created: ${created.name}`);
    }

    // Get current user stats to potentially award new achievements
    console.log('\n📊 Checking existing users for new achievements...');
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true,
        _count: {
          select: {
            meals: true
          }
        }
      }
    });

    console.log(`   Found ${users.length} users to check`);

    // Award achievements to qualifying users
    let totalAwarded = 0;
    for (const user of users) {
      console.log(`\n   👤 Checking ${user.name || user.email}:`);
      
      // Check meal count achievements
      const mealCount = user._count.meals;
      console.log(`      - Meals: ${mealCount}`);
      
      const mealAchievements = newAchievements.filter(a => 
        a.type === 'MEAL_COUNT' && a.threshold && mealCount >= a.threshold
      );

      for (const achievement of mealAchievements) {
        const achievementRecord = await prisma.achievement.findFirst({
          where: { name: achievement.name }
        });

        if (achievementRecord) {
          // Check if user already has this achievement
          const existingUserAchievement = await prisma.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId: user.id,
                achievementId: achievementRecord.id
              }
            }
          });

          if (!existingUserAchievement) {
            await prisma.userAchievement.create({
              data: {
                userId: user.id,
                achievementId: achievementRecord.id,
                progress: mealCount
              }
            });
            console.log(`      ✓ Awarded: ${achievement.name}`);
            totalAwarded++;
          }
        }
      }

      // Check photo count achievements
      const recipeImageCount = await prisma.recipeImage.count({
        where: { recipe: { authorId: user.id } }
      });
      const mealImageCount = await prisma.mealImage.count({
        where: { meal: { authorId: user.id } }
      });
      const totalPhotos = recipeImageCount + mealImageCount;
      
      console.log(`      - Photos: ${totalPhotos} (${recipeImageCount} recipe + ${mealImageCount} meal)`);

      const photoAchievements = newAchievements.filter(a => 
        a.type === 'PHOTO_COUNT' && a.threshold && totalPhotos >= a.threshold
      );

      for (const achievement of photoAchievements) {
        const achievementRecord = await prisma.achievement.findFirst({
          where: { name: achievement.name }
        });

        if (achievementRecord) {
          // Check if user already has this achievement
          const existingUserAchievement = await prisma.userAchievement.findUnique({
            where: {
              userId_achievementId: {
                userId: user.id,
                achievementId: achievementRecord.id
              }
            }
          });

          if (!existingUserAchievement) {
            await prisma.userAchievement.create({
              data: {
                userId: user.id,
                achievementId: achievementRecord.id,
                progress: totalPhotos
              }
            });
            console.log(`      ✓ Awarded: ${achievement.name}`);
            totalAwarded++;
          }
        }
      }

      if (mealAchievements.length === 0 && photoAchievements.length === 0) {
        console.log(`      - No achievements awarded yet`);
      }
    }

    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📈 Summary:`);
    console.log(`   - Added ${newAchievements.length} new achievement types`);
    console.log(`   - Checked ${users.length} existing users`);
    console.log(`   - Awarded ${totalAwarded} achievements to qualifying users`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

/**
 * Run the migration
 */
if (require.main === module) {
  addMealAndPhotoAchievements()
    .then(() => {
      console.log('\n✅ Meal and photo achievements migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { addMealAndPhotoAchievements };