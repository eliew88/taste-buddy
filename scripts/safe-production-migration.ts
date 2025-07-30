#!/usr/bin/env tsx

/**
 * SAFE Production Migration Script
 * 
 * This script ONLY adds new data to production - it does NOT delete or modify existing data.
 * It adds the new MEAL_COUNT and PHOTO_COUNT achievement types and creates the new achievements.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function safeProductionMigration() {
  console.log('🔍 Starting SAFE production migration...\n');

  try {
    // First, let's check what achievements already exist
    console.log('📊 Checking current achievements in database...');
    const existingAchievements = await prisma.achievement.findMany({
      select: { id: true, name: true, type: true, threshold: true }
    });
    
    console.log(`Found ${existingAchievements.length} existing achievements:`);
    existingAchievements.forEach(achievement => {
      console.log(`  - ${achievement.name} (${achievement.type}, threshold: ${achievement.threshold})`);
    });
    console.log('');

    // Define the new achievements we want to add
    const newMealAchievements = [
      {
        type: 'MEAL_COUNT',
        name: 'First Meal',
        description: 'Post your first meal memory',
        icon: '🍽️',
        color: '#3B82F6',
        threshold: 1,
      },
      {
        type: 'MEAL_COUNT',
        name: 'Meal Explorer',
        description: 'Share 5 meal memories',
        icon: '🗺️',
        color: '#3B82F6',
        threshold: 5,
      },
      {
        type: 'MEAL_COUNT',
        name: 'Meal Curator',
        description: 'Document 10 delicious meals',
        icon: '📚',
        color: '#3B82F6',
        threshold: 10,
      },
      {
        type: 'MEAL_COUNT',
        name: 'Meal Master',
        description: 'Share 25 amazing meal experiences',
        icon: '🏆',
        color: '#3B82F6',
        threshold: 25,
      },
      {
        type: 'MEAL_COUNT',
        name: 'Meal Legend',
        description: 'Document 50 incredible meals',
        icon: '👑',
        color: '#3B82F6',
        threshold: 50,
      },
    ];

    const newPhotoAchievements = [
      {
        type: 'PHOTO_COUNT',
        name: 'First Shot',
        description: 'Upload your first photo',
        icon: '📸',
        color: '#10B981',
        threshold: 1,
      },
      {
        type: 'PHOTO_COUNT',
        name: 'Photographer',
        description: 'Share 10 beautiful food photos',
        icon: '📷',
        color: '#10B981',
        threshold: 10,
      },
      {
        type: 'PHOTO_COUNT',
        name: 'Visual Storyteller',
        description: 'Capture 50 stunning food moments',
        icon: '🎨',
        color: '#10B981',
        threshold: 50,
      },
    ];

    const allNewAchievements = [...newMealAchievements, ...newPhotoAchievements];

    // Check which achievements don't already exist (by name to avoid duplicates)
    console.log('🔍 Checking for new achievements to add...');
    const existingNames = new Set(existingAchievements.map(a => a.name));
    const achievementsToAdd = allNewAchievements.filter(achievement => 
      !existingNames.has(achievement.name)
    );

    if (achievementsToAdd.length === 0) {
      console.log('✅ All achievements already exist in the database!');
      console.log('✅ Migration completed successfully - no changes needed.\n');
      return;
    }

    console.log(`📝 Found ${achievementsToAdd.length} new achievements to add:`);
    achievementsToAdd.forEach(achievement => {
      console.log(`  - ${achievement.name} (${achievement.type}, threshold: ${achievement.threshold})`);
    });
    console.log('');

    // Add the new achievements ONE BY ONE for safety
    console.log('🚀 Adding new achievements to database...');
    for (const achievement of achievementsToAdd) {
      try {
        const created = await prisma.achievement.create({
          data: achievement
        });
        console.log(`✅ Created: ${created.name} (ID: ${created.id})`);
      } catch (error) {
        console.error(`❌ Failed to create ${achievement.name}:`, error);
        // Continue with other achievements even if one fails
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Final achievement count:');
    
    const finalCount = await prisma.achievement.count();
    console.log(`   Total achievements: ${finalCount}`);
    
    const mealAchievements = await prisma.achievement.count({
      where: { type: 'MEAL_COUNT' }
    });
    console.log(`   Meal achievements: ${mealAchievements}`);
    
    const photoAchievements = await prisma.achievement.count({
      where: { type: 'PHOTO_COUNT' }
    });
    console.log(`   Photo achievements: ${photoAchievements}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  safeProductionMigration()
    .then(() => {
      console.log('\n✅ Safe production migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Safe production migration failed:', error);
      process.exit(1);
    });
}

export { safeProductionMigration };