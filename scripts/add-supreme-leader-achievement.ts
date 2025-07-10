import { PrismaClient, AchievementType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Production-safe migration to add Supreme Leader achievement
 * This script ONLY adds the new achievement without deleting existing data
 */

const SUPREME_LEADER_ACHIEVEMENT = {
  type: AchievementType.SPECIAL,
  name: 'Supreme Leader',
  description: 'The legendary founder and supreme leader of TasteBuddy',
  icon: '🦄🌈',
  color: '#EC4899', // pink-500
  threshold: 1,
  isActive: true
};

async function addSupremeLeaderAchievement() {
  console.log('🦄 Adding Supreme Leader achievement to production...');
  
  try {
    // Check if achievement already exists
    const existingAchievement = await prisma.achievement.findFirst({
      where: { 
        name: SUPREME_LEADER_ACHIEVEMENT.name,
        type: SUPREME_LEADER_ACHIEVEMENT.type 
      }
    });
    
    if (!existingAchievement) {
      const achievement = await prisma.achievement.create({
        data: SUPREME_LEADER_ACHIEVEMENT
      });
      console.log(`   ✅ Added achievement: ${achievement.name} (ID: ${achievement.id})`);
      
      // Auto-award to site owner if they exist
      const siteOwner = await prisma.user.findFirst({
        where: { email: 'eliechtw@gmail.com' }
      });
      
      if (siteOwner) {
        // Check if already awarded
        const existingAward = await prisma.userAchievement.findFirst({
          where: {
            userId: siteOwner.id,
            achievementId: achievement.id
          }
        });
        
        if (!existingAward) {
          await prisma.userAchievement.create({
            data: {
              userId: siteOwner.id,
              achievementId: achievement.id,
              progress: 1
            }
          });
          console.log(`   🎉 Automatically awarded Supreme Leader achievement to ${siteOwner.email}`);
        }
      } else {
        console.log(`   ℹ️  Site owner not found in database yet. Achievement will be awarded on first evaluation.`);
      }
    } else {
      console.log(`   ⚠️  Achievement already exists: ${SUPREME_LEADER_ACHIEVEMENT.name}`);
    }
    
    console.log('✅ Supreme Leader achievement migration completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error adding Supreme Leader achievement:', error);
    return false;
  }
}

// Only run if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  addSupremeLeaderAchievement()
    .then((success) => {
      if (success) {
        console.log('🦄🌈 Supreme Leader achievement is ready!');
        process.exit(0);
      } else {
        console.error('💥 Failed to add Supreme Leader achievement');
        process.exit(1);
      }
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { addSupremeLeaderAchievement };