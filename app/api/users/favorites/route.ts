/**
 * User Favorites API Route
 * 
 * Handles fetching the current user's favorite recipes.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

export async function GET() {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's favorites with recipe details
    const favorites = await prisma.favorite.findMany({
      where: {
        userId: userId
      },
      include: {
        recipe: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            },
            _count: {
              select: { favorites: true, ratings: true }
            }
          }
        }
      },
      orderBy: {
        recipe: {
          createdAt: 'desc'
        }
      }
    });

    // Transform the data to match expected format
    const transformedFavorites = favorites.map(favorite => {
      const recipe = favorite.recipe;
      return {
        ...recipe,
        ingredients: typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients) 
          : recipe.ingredients,
        tags: typeof recipe.tags === 'string' 
          ? JSON.parse(recipe.tags) 
          : recipe.tags,
        avgRating: 0, // TODO: Calculate actual average rating
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedFavorites,
    });

  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}