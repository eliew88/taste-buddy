import { PrismaClient, AchievementType } from '@prisma/client';

const prisma = new PrismaClient();

export const ACHIEVEMENT_DEFINITIONS = [
  // Recipe Count Achievements
  {
    type: AchievementType.RECIPE_COUNT,
    name: 'First Recipe',
    description: 'Share your very first recipe with the community',
    icon: '🍳',
    color: '#10B981', // green-500
    threshold: 1,
    isActive: true
  },
  {
    type: AchievementType.RECIPE_COUNT,
    name: 'Home Cook',
    description: 'Share 5 delicious recipes',
    icon: '👨‍🍳',
    color: '#10B981', // green-500
    threshold: 5,
    isActive: true
  },
  {
    type: AchievementType.RECIPE_COUNT,
    name: 'Recipe Master',
    description: 'Share 25 amazing recipes with the community',
    icon: '🏆',
    color: '#F59E0B', // yellow-500
    threshold: 25,
    isActive: true
  },
  {
    type: AchievementType.RECIPE_COUNT,
    name: 'Culinary Legend',
    description: 'Share 100 incredible recipes - you\'re a true legend!',
    icon: '👑',
    color: '#8B5CF6', // purple-500
    threshold: 100,
    isActive: true
  },

  // Popularity Achievements (Favorites)
  {
    type: AchievementType.FAVORITES_COUNT,
    name: 'Community Favorite',
    description: 'Receive 50 total favorites on your recipes',
    icon: '❤️',
    color: '#EF4444', // red-500
    threshold: 50,
    isActive: true
  },
  {
    type: AchievementType.FAVORITES_COUNT,
    name: 'Beloved Chef',
    description: 'Receive 200 total favorites - you\'re beloved by the community!',
    icon: '💖',
    color: '#EC4899', // pink-500
    threshold: 200,
    isActive: true
  },
  {
    type: AchievementType.FAVORITES_COUNT,
    name: 'Recipe Superstar',
    description: 'Receive 1000 total favorites - you\'re a true superstar!',
    icon: '🌟',
    color: '#F59E0B', // yellow-500
    threshold: 1000,
    isActive: true
  },

  // Social Achievements (Followers)
  {
    type: AchievementType.FOLLOWERS_COUNT,
    name: 'Social Butterfly',
    description: 'Gain 10 followers who love your recipes',
    icon: '🦋',
    color: '#06B6D4', // cyan-500
    threshold: 10,
    isActive: true
  },
  {
    type: AchievementType.FOLLOWERS_COUNT,
    name: 'Influencer',
    description: 'Gain 100 followers - you\'re becoming an influencer!',
    icon: '📢',
    color: '#8B5CF6', // purple-500
    threshold: 100,
    isActive: true
  },
  {
    type: AchievementType.FOLLOWERS_COUNT,
    name: 'Celebrity Chef',
    description: 'Gain 500 followers - you\'re a celebrity in the kitchen!',
    icon: '⭐',
    color: '#F59E0B', // yellow-500
    threshold: 500,
    isActive: true
  },

  // Special Social Achievement (Mutual Follow)
  {
    type: AchievementType.SPECIAL,
    name: 'BFF',
    description: 'Become TasteBuddies with someone (mutual following)',
    icon: '👯',
    color: '#EC4899', // pink-500
    threshold: 1, // First mutual follow
    isActive: true
  },

  // Quality Achievements (Ratings)
  {
    type: AchievementType.RATINGS_COUNT,
    name: '5-Star Chef',
    description: 'Have a recipe with 4.5+ average rating',
    icon: '⭐',
    color: '#F59E0B', // yellow-500
    threshold: 45, // Stored as 45 (4.5 * 10 for precision)
    isActive: true
  },
  {
    type: AchievementType.RATINGS_COUNT,
    name: 'Consistent Quality',
    description: 'Have 10 recipes with 4+ average rating',
    icon: '🎯',
    color: '#10B981', // green-500
    threshold: 10, // 10 recipes with 4+ rating
    isActive: true
  },

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
  },

  // Special Site Owner Achievement
  {
    type: AchievementType.SPECIAL,
    name: 'Supreme Leader',
    description: 'The legendary founder and supreme leader of TasteBuddy',
    icon: '🦄🌈',
    color: '#EC4899', // pink-500
    threshold: 1,
    isActive: true
  }
];

export async function seedAchievements() {
  console.log('🏆 Seeding achievements...');
  
  try {
    // Clear existing achievements
    await prisma.userAchievement.deleteMany({});
    await prisma.achievement.deleteMany({});
    
    // Create achievements
    for (const achievement of ACHIEVEMENT_DEFINITIONS) {
      await prisma.achievement.create({
        data: achievement
      });
    }
    
    console.log(`✅ Created ${ACHIEVEMENT_DEFINITIONS.length} achievements`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding achievements:', error);
    return false;
  }
}

// Export achievement criteria for evaluation
export const ACHIEVEMENT_CRITERIA = {
  // Recipe count achievements
  RECIPE_COUNT: {
    evaluate: async (userId: string) => {
      const count = await prisma.recipe.count({
        where: { authorId: userId }
      });
      return count;
    }
  },

  // Favorites count achievements
  FAVORITES_COUNT: {
    evaluate: async (userId: string) => {
      // Get actual favorites count
      const favorites = await prisma.favorite.count({
        where: {
          recipe: {
            authorId: userId
          }
        }
      });
      
      return favorites;
    }
  },

  // Followers count achievements
  FOLLOWERS_COUNT: {
    evaluate: async (userId: string) => {
      const count = await prisma.follow.count({
        where: { followingId: userId }
      });
      return count;
    }
  },

  // Special achievements
  SPECIAL: {
    // BFF achievement - mutual following
    BFF: async (userId: string) => {
      // Find users this person follows
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });

      if (following.length === 0) return 0;

      // Check if any of those users follow back
      const mutualFollows = await prisma.follow.count({
        where: {
          followerId: { in: following.map(f => f.followingId) },
          followingId: userId
        }
      });

      return mutualFollows > 0 ? 1 : 0;
    },

    // Supreme Leader achievement - site owner only
    'Supreme Leader': async (userId: string) => {
      // Check if this user is the site owner
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      });

      // Only award to the site owner
      return user?.email === 'eliechtw@gmail.com' ? 1 : 0;
    }
  },

  // Quality achievements (ratings)
  RATINGS_COUNT: {
    // 5-Star Chef - at least one recipe with 4.5+ avg rating
    '5-Star Chef': async (userId: string) => {
      const recipes = await prisma.recipe.findMany({
        where: { 
          authorId: userId,
          ratings: { some: {} } // Only recipes with ratings
        },
        include: {
          ratings: { select: { rating: true } }
        }
      });

      for (const recipe of recipes) {
        if (recipe.ratings.length >= 3) { // Minimum 3 ratings
          const avgRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length;
          if (avgRating >= 4.5) {
            return 1; // Has at least one 4.5+ rated recipe
          }
        }
      }
      return 0;
    },

    // Consistent Quality - 10 recipes with 4+ avg rating
    'Consistent Quality': async (userId: string) => {
      const recipes = await prisma.recipe.findMany({
        where: { 
          authorId: userId,
          ratings: { some: {} } // Only recipes with ratings
        },
        include: {
          ratings: { select: { rating: true } }
        }
      });

      let qualityRecipes = 0;
      for (const recipe of recipes) {
        if (recipe.ratings.length >= 2) { // Minimum 2 ratings
          const avgRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length;
          if (avgRating >= 4.0) {
            qualityRecipes++;
          }
        }
      }
      return qualityRecipes;
    }
  },

  // Comment achievements
  COMMENTS_COUNT: {
    evaluate: async (userId: string) => {
      // Check if user has a recipe with more than 10 comments
      const recipe = await prisma.recipe.findFirst({
        where: { 
          authorId: userId,
          comments: {
            some: {} // Only recipes with comments
          }
        },
        include: {
          _count: {
            select: { comments: true }
          }
        },
        orderBy: {
          comments: {
            _count: 'desc'
          }
        }
      });

      if (recipe && recipe._count.comments > 10) {
        return 1; // Has at least one recipe with >10 comments
      }
      return 0;
    }
  },

  // Ingredient achievements
  INGREDIENTS_COUNT: {
    evaluate: async (userId: string) => {
      // Get all ingredients from user's recipes
      const ingredients = await prisma.ingredientEntry.findMany({
        where: {
          recipe: {
            authorId: userId
          }
        },
        select: {
          ingredient: true
        }
      });

      // Create a set to get unique ingredients (case-insensitive)
      const uniqueIngredients = new Set(
        ingredients.map(ing => ing.ingredient.toLowerCase().trim())
      );

      return uniqueIngredients.size;
    }
  }
};

// Only run if this file is executed directly (not when imported)
if (typeof require !== 'undefined' && require.main === module) {
  seedAchievements()
    .then(() => {
      console.log('🎉 Achievement seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Achievement seeding failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}