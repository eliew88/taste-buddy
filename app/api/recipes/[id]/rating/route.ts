/**
 * Recipe Rating API Route
 * 
 * Handles rating recipes with persistent storage and validation.
 * Supports creating new ratings and updating existing ones.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { z } from 'zod';

const ratingSchema = z.object({
  rating: z.number().min(1).max(5).int(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Get authenticated user ID
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: recipeId } = params;
    const body = await request.json();
    const validation = ratingSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error.errors[0].message 
        },
        { status: 400 }
      );
    }

    const { rating } = validation.data;

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

    // Check if user has already rated this recipe
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    let savedRating;
    let isUpdate = false;

    if (existingRating) {
      // Update existing rating
      savedRating = await prisma.rating.update({
        where: {
          userId_recipeId: {
            userId,
            recipeId
          }
        },
        data: {
          rating
        }
      });
      isUpdate = true;
    } else {
      // Create new rating
      savedRating = await prisma.rating.create({
        data: {
          userId,
          recipeId,
          rating
        }
      });
    }

    // Calculate updated recipe statistics
    const ratingStats = await prisma.rating.aggregate({
      where: { recipeId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        rating: savedRating.rating,
        isUpdate,
        recipeStats: {
          averageRating: ratingStats._avg.rating || 0,
          ratingCount: ratingStats._count.rating || 0
        }
      }
    });

  } catch (error) {
    console.error('Error managing rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save rating' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's rating for a recipe
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: recipeId } = params;

    // Get user's rating for this recipe
    const userRating = await prisma.rating.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId
        }
      }
    });

    // Get recipe rating statistics
    const ratingStats = await prisma.rating.aggregate({
      where: { recipeId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        userRating: userRating?.rating || 0,
        recipeStats: {
          averageRating: ratingStats._avg.rating || 0,
          ratingCount: ratingStats._count.rating || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching rating:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}