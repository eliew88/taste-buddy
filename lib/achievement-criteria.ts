import { prisma } from '@/lib/db';

/**
 * Achievement criteria evaluation functions
 * These functions evaluate user progress towards achievements
 */
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
      // Get Recipe Book favorites count for this user's recipes
      const favorites = await prisma.recipeBookEntry.count({
        where: {
          recipe: {
            authorId: userId
          },
          category: {
            name: "Favorites"
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

  // Meal count achievements
  MEAL_COUNT: {
    evaluate: async (userId: string) => {
      const count = await prisma.meal.count({
        where: { authorId: userId }
      });
      return count;
    }
  },

  // Photo count achievements (across recipes and meals)
  PHOTO_COUNT: {
    evaluate: async (userId: string) => {
      // Count recipe images
      const recipeImageCount = await prisma.recipeImage.count({
        where: {
          recipe: {
            authorId: userId
          }
        }
      });

      // Count meal images
      const mealImageCount = await prisma.mealImage.count({
        where: {
          meal: {
            authorId: userId
          }
        }
      });

      return recipeImageCount + mealImageCount;
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