#!/usr/bin/env tsx

/**
 * Script to check what data exists in the production database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProductionData() {
  console.log('🔍 Checking production database content...\n');

  try {
    // Check users
    const userCount = await prisma.user.count();
    console.log(`👥 Users: ${userCount}`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, name: true, createdAt: true }
      });
      console.log('   Users found:');
      users.forEach(user => {
        console.log(`     - ${user.name || 'No name'} (${user.email}) - Created: ${user.createdAt.toLocaleDateString()}`);
      });
    }

    // Check recipes
    const recipeCount = await prisma.recipe.count();
    console.log(`\n🍳 Recipes: ${recipeCount}`);
    
    if (recipeCount > 0) {
      const recipes = await prisma.recipe.findMany({
        select: { id: true, title: true, author: { select: { name: true } }, createdAt: true }
      });
      console.log('   Recipes found:');
      recipes.forEach(recipe => {
        console.log(`     - "${recipe.title}" by ${recipe.author.name} - Created: ${recipe.createdAt.toLocaleDateString()}`);
      });
    }

    // Check meals
    const mealCount = await prisma.meal.count();
    console.log(`\n🍽️ Meals: ${mealCount}`);
    
    if (mealCount > 0) {
      const meals = await prisma.meal.findMany({
        select: { id: true, name: true, author: { select: { name: true } }, createdAt: true }
      });
      console.log('   Meals found:');
      meals.forEach(meal => {
        console.log(`     - "${meal.name}" by ${meal.author.name} - Created: ${meal.createdAt.toLocaleDateString()}`);
      });
    }

    // Check achievements
    const achievementCount = await prisma.achievement.count();
    console.log(`\n🏆 Achievements: ${achievementCount}`);

    // Check user achievements
    const userAchievementCount = await prisma.userAchievement.count();
    console.log(`🎖️ User Achievements: ${userAchievementCount}`);

    // Check favorites
    const favoriteCount = await prisma.favorite.count();
    console.log(`❤️ Favorites: ${favoriteCount}`);

    // Check ratings
    const ratingCount = await prisma.rating.count();
    console.log(`⭐ Ratings: ${ratingCount}`);

    // Check follows
    const followCount = await prisma.follow.count();
    console.log(`👫 Follows: ${followCount}`);

    console.log('\n✅ Database check complete!');

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkProductionData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { checkProductionData };