/**
 * Recipe Favorites API Route
 * 
 * Handles adding/removing recipes from user favorites.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { z } from 'zod';
import { evaluateFavoriteAchievements } from '@/lib/achievement-service';

const favoriteSchema = z.object({
  recipeId: z.string().min(1, 'Recipe ID is required'),
  action: z.enum(['add', 'remove', 'toggle']).optional().default('toggle'),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = favoriteSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.errors[0].message 
        },
        { status: 400 }
      );
    }

    const { recipeId, action } = validation.data;

    // Check if recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    let isFavorited = false;
    let message = '';

    let shouldEvaluateAchievements = false;
    const recipeAuthorId = recipe.authorId;

    if (action === 'add' || (action === 'toggle' && !existingFavorite)) {
      // Add to favorites
      if (!existingFavorite) {
        await prisma.favorite.create({
          data: {
            userId,
            recipeId
          }
        });
        isFavorited = true;
        message = 'Recipe added to favorites';
        shouldEvaluateAchievements = true;
      } else {
        isFavorited = true;
        message = 'Recipe already in favorites';
      }
    } else if (action === 'remove' || (action === 'toggle' && existingFavorite)) {
      // Remove from favorites
      if (existingFavorite) {
        await prisma.favorite.delete({
          where: {
            userId_recipeId: {
              userId,
              recipeId
            }
          }
        });
        isFavorited = false;
        message = 'Recipe removed from favorites';
        shouldEvaluateAchievements = true;
      } else {
        isFavorited = false;
        message = 'Recipe not in favorites';
      }
    }

    // Evaluate achievements for the recipe author when favorites change
    if (shouldEvaluateAchievements) {
      try {
        console.log('Evaluating achievements for favorite action...');
        const achievementResult = await evaluateFavoriteAchievements(recipeAuthorId);
        
        // Log any new achievements
        if (achievementResult.newAchievements.length > 0) {
          console.log(`Recipe author earned achievements:`, 
            achievementResult.newAchievements.map(a => a.achievement.name));
        }
        
      } catch (error) {
        console.error('Failed to evaluate achievements for favorite:', error);
        // Don't fail the favorite action if achievement evaluation fails
      }
    }

    // Get updated favorite count for the recipe
    const favoriteCount = await prisma.favorite.count({
      where: { recipeId }
    });

    return NextResponse.json({
      success: true,
      data: {
        isFavorited,
        favoriteCount,
        message
      }
    });

  } catch (error) {
    console.error('Error managing favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update favorite status' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if a recipe is favorited by the current user
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');

    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    const favoriteCount = await prisma.favorite.count({
      where: { recipeId }
    });

    return NextResponse.json({
      success: true,
      data: {
        isFavorited: !!favorite,
        favoriteCount
      }
    });

  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}