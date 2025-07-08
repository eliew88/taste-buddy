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
            },
            ratings: {
              select: { rating: true }
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

    // Transform the data to match expected format (PostgreSQL native arrays)
    const transformedFavorites = favorites.map(favorite => {
      const recipe = favorite.recipe;
      return {
        ...recipe,
        // Calculate actual average rating from ratings
        avgRating: recipe.ratings?.length > 0 
          ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length
          : 0,
        // Remove ratings array from response
        ratings: undefined,
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