/**
 * Recipe Book Stats API Route
 * 
 * Provides statistics about the user's recipe book, including total unique recipe count.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET - Get recipe book statistics
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get total unique recipes in user's recipe book
    const uniqueRecipes = await prisma.recipeBookEntry.findMany({
      where: { userId },
      select: { recipeId: true },
      distinct: ['recipeId']
    });

    const totalUniqueRecipes = uniqueRecipes.length;

    // Get total entries (including duplicates across categories)
    const totalEntries = await prisma.recipeBookEntry.count({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalUniqueRecipes,
        totalEntries
      }
    });

  } catch (error) {
    console.error('Error fetching recipe book stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipe book stats' },
      { status: 500 }
    );
  }
}