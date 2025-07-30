/**
 * Achievement Service
 * 
 * Centralized service for evaluating and awarding achievements automatically
 * when users perform actions that could unlock achievements.
 */

import { prisma } from '@/lib/db';
import { ACHIEVEMENT_CRITERIA } from '@/lib/achievement-criteria';

export type AchievementType = 
  | 'RECIPE_COUNT' 
  | 'FAVORITES_COUNT' 
  | 'FOLLOWERS_COUNT' 
  | 'MEAL_COUNT'
  | 'PHOTO_COUNT'
  | 'RATINGS_COUNT'
  | 'SPECIAL'
  | 'COMMENTS_COUNT'
  | 'INGREDIENTS_COUNT';

export interface AchievementResult {
  newAchievements: Array<{
    id: string;
    achievement: {
      name: string;
      description: string;
      icon: string;
      color: string;
    };
  }>;
  evaluated: number;
  alreadyEarned: number;
}

/**
 * Evaluate specific achievement types for a user
 * This is more efficient than evaluating all achievements
 */
export async function evaluateAchievements(
  userId: string,
  types: AchievementType[]
): Promise<AchievementResult> {
  console.log(`Evaluating achievements for user ${userId}, types: ${types.join(', ')}`);
  
  // Get achievements for the specified types
  const achievements = await prisma.achievement.findMany({
    where: {
      isActive: true,
      type: { in: types }
    }
  });
  
  console.log(`Found ${achievements.length} active achievements to evaluate`);

  // Get user's existing achievements
  const existingAchievements = await prisma.userAchievement.findMany({
    where: { 
      userId,
      achievementId: { in: achievements.map(a => a.id) }
    },
    select: { achievementId: true }
  });
  
  const existingAchievementIds = new Set(existingAchievements.map(ua => ua.achievementId));
  const newAchievements = [];
  let evaluated = 0;
  let alreadyEarned = existingAchievementIds.size;

  // Evaluate each achievement
  for (const achievement of achievements) {
    evaluated++;
    
    // Skip if user already has this achievement
    if (existingAchievementIds.has(achievement.id)) {
      continue;
    }

    let earned = false;
    let progress = 0;

    try {
      // Evaluate based on type
      switch (achievement.type) {
        case 'RECIPE_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.RECIPE_COUNT.evaluate(userId);
          earned = achievement.threshold ? progress >= achievement.threshold : false;
          break;

        case 'FAVORITES_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.FAVORITES_COUNT.evaluate(userId);
          earned = achievement.threshold ? progress >= achievement.threshold : false;
          break;

        case 'FOLLOWERS_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.FOLLOWERS_COUNT.evaluate(userId);
          earned = achievement.threshold ? progress >= achievement.threshold : false;
          break;

        case 'MEAL_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.MEAL_COUNT.evaluate(userId);
          earned = achievement.threshold ? progress >= achievement.threshold : false;
          break;

        case 'PHOTO_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.PHOTO_COUNT.evaluate(userId);
          earned = achievement.threshold ? progress >= achievement.threshold : false;
          break;

        case 'RATINGS_COUNT':
          if (achievement.name === '5-Star Chef') {
            progress = await ACHIEVEMENT_CRITERIA.RATINGS_COUNT['5-Star Chef'](userId);
            earned = achievement.threshold ? progress >= achievement.threshold : false;
          } else if (achievement.name === 'Consistent Quality') {
            progress = await ACHIEVEMENT_CRITERIA.RATINGS_COUNT['Consistent Quality'](userId);
            earned = achievement.threshold ? progress >= achievement.threshold : false;
          }
          break;

        case 'COMMENTS_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.COMMENTS_COUNT.evaluate(userId);
          earned = achievement.threshold ? progress >= achievement.threshold : false;
          break;

        case 'SPECIAL':
          if (achievement.name === 'BFF') {
            progress = await ACHIEVEMENT_CRITERIA.SPECIAL.BFF(userId);
            earned = achievement.threshold ? progress >= achievement.threshold : false;
          } else if (achievement.name === 'Supreme Leader') {
            progress = await ACHIEVEMENT_CRITERIA.SPECIAL['Supreme Leader'](userId);
            earned = achievement.threshold ? progress >= achievement.threshold : false;
          }
          break;
      }

      // Award achievement if earned
      if (earned) {
        console.log(`User ${userId} earned achievement: ${achievement.name}`);
        
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: progress,
            earnedAt: new Date()
          },
          include: {
            achievement: {
              select: {
                name: true,
                description: true,
                icon: true,
                color: true
              }
            }
          }
        });
        
        newAchievements.push(userAchievement);
      }
    } catch (error) {
      console.error(`Error evaluating achievement ${achievement.name}:`, error);
      // Continue with other achievements even if one fails
    }
  }

  console.log(`Achievement evaluation completed: ${newAchievements.length} new, ${alreadyEarned} already earned`);
  
  return {
    newAchievements,
    evaluated,
    alreadyEarned
  };
}

/**
 * Helper functions for common achievement evaluation scenarios
 */

// After creating or deleting a recipe
export async function evaluateRecipeAchievements(userId: string): Promise<AchievementResult> {
  return evaluateAchievements(userId, ['RECIPE_COUNT', 'INGREDIENTS_COUNT']);
}

// After creating or deleting a meal
export async function evaluateMealAchievements(userId: string): Promise<AchievementResult> {
  return evaluateAchievements(userId, ['MEAL_COUNT']);
}

// After uploading photos (for recipes or meals)
export async function evaluatePhotoAchievements(userId: string): Promise<AchievementResult> {
  return evaluateAchievements(userId, ['PHOTO_COUNT']);
}

// After following or unfollowing someone
export async function evaluateFollowAchievements(followerId: string, followingId: string): Promise<AchievementResult[]> {
  // Check achievements for both users involved
  const results = await Promise.all([
    // Check if the person being followed gained a follower achievement
    evaluateAchievements(followingId, ['FOLLOWERS_COUNT']),
    // Check if the follower got the BFF achievement (mutual follow)
    evaluateAchievements(followerId, ['SPECIAL'])
  ]);
  
  return results;
}

// After a recipe receives favorites
export async function evaluateFavoriteAchievements(recipeAuthorId: string): Promise<AchievementResult> {
  return evaluateAchievements(recipeAuthorId, ['FAVORITES_COUNT']);
}

// After a recipe receives ratings
export async function evaluateRatingAchievements(recipeAuthorId: string): Promise<AchievementResult> {
  return evaluateAchievements(recipeAuthorId, ['RATINGS_COUNT']);
}

// After a recipe receives comments
export async function evaluateCommentAchievements(recipeAuthorId: string): Promise<AchievementResult> {
  return evaluateAchievements(recipeAuthorId, ['COMMENTS_COUNT']);
}

/**
 * Evaluate all achievements for a user (used for manual refresh)
 */
export async function evaluateAllAchievements(userId: string): Promise<AchievementResult> {
  const allTypes: AchievementType[] = [
    'RECIPE_COUNT',
    'FAVORITES_COUNT', 
    'FOLLOWERS_COUNT',
    'MEAL_COUNT',
    'PHOTO_COUNT',
    'RATINGS_COUNT',
    'SPECIAL',
    'COMMENTS_COUNT',
    'INGREDIENTS_COUNT'
  ];
  
  return evaluateAchievements(userId, allTypes);
}