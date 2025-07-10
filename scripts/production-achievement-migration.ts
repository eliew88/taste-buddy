import { PrismaClient, AchievementType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Production-safe migration to add new achievements
 * This script ONLY adds new achievements without deleting existing data
 */

const NEW_ACHIEVEMENTS = [
  // Comment Achievements
  {
    type: AchievementType.COMMENTS_COUNT,
    name: 'Hot Topic',
    description: 'Have a recipe with more than 10 comments',
    icon: '🌶️',
    color: '#EF4444', // red-500
    threshold: 10,
    isActive: true
  },

  // Ingredient Achievements
  {
    type: AchievementType.INGREDIENTS_COUNT,
    name: 'Resourceful',
    description: 'Use more than 50 unique ingredients across all your recipes',
    icon: '🧑‍🍳',
    color: '#8B5CF6', // purple-500
    threshold: 50,
    isActive: true
  }
];

async function addNewAchievements() {
  console.log('🏆 Adding new achievements to production...');
  
  try {
    for (const achievement of NEW_ACHIEVEMENTS) {
      // Check if achievement already exists
      const existingAchievement = await prisma.achievement.findFirst({
        where: { 
          name: achievement.name,
          type: achievement.type 
        }
      });
      
      if (!existingAchievement) {
        await prisma.achievement.create({
          data: achievement
        });
        console.log(`   ✅ Added achievement: ${achievement.name}`);
      } else {
        console.log(`   ⚠️  Achievement already exists: ${achievement.name}`);
      }
    }
    
    console.log('✅ Production achievement migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error adding new achievements:', error);
    return false;
  }
}

// Only run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  addNewAchievements()
    .then((success) => {
      if (success) {
        console.log('🎉 New achievements added to production!');
        process.exit(0);
      } else {
        console.error('💥 Failed to add new achievements');
        process.exit(1);
      }
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { addNewAchievements };