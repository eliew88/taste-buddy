/**
 * Recipe Book Recipe Management API Route
 * 
 * Handles operations on specific recipes in the user's recipe book,
 * including updating categories and removing from book.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET - Get recipe book status for a specific recipe
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { recipeId } = await params;

    // Get all recipe book entries for this recipe and user
    const entries = await prisma.recipeBookEntry.findMany({
      where: {
        userId,
        recipeId
      },
      include: {
        category: {
          select: { id: true, name: true, color: true }
        }
      }
    });

    const inBook = entries.length > 0;
    const categories = entries.map(entry => entry.category).filter(Boolean);
    const notes = entries.find(entry => entry.notes)?.notes || null;

    return NextResponse.json({
      success: true,
      data: {
        inBook,
        categories,
        notes
      }
    });

  } catch (error) {
    console.error('Error fetching recipe book status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipe book status' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update recipe's categories in the recipe book
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { recipeId } = await params;
    const body = await request.json();
    const { categoryIds, notes } = body;

    // Verify recipe exists
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId }
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // If categories are specified, verify they belong to the user
    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      const categories = await prisma.recipeBookCategory.findMany({
        where: {
          id: { in: categoryIds },
          userId: userId
        }
      });

      if (categories.length !== categoryIds.length) {
        return NextResponse.json(
          { success: false, error: 'One or more categories not found' },
          { status: 404 }
        );
      }
    }

    // Remove all existing entries for this recipe and user
    await prisma.recipeBookEntry.deleteMany({
      where: {
        userId,
        recipeId
      }
    });

    // Create new entries
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      // Add recipe without category
      await prisma.recipeBookEntry.create({
        data: {
          userId,
          recipeId,
          categoryId: null,
          notes: notes?.trim() || null
        }
      });
    } else {
      // Add recipe to specified categories
      await prisma.recipeBookEntry.createMany({
        data: categoryIds.map((categoryId: string) => ({
          userId,
          recipeId,
          categoryId,
          notes: notes?.trim() || null
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe categories updated successfully'
    });

  } catch (error) {
    console.error('Error updating recipe categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recipe categories' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove recipe from recipe book completely
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ recipeId: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { recipeId } = await params;

    // Remove all entries for this recipe and user
    const deletedEntries = await prisma.recipeBookEntry.deleteMany({
      where: {
        userId,
        recipeId
      }
    });

    if (deletedEntries.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found in your recipe book' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Recipe removed from recipe book successfully'
    });

  } catch (error) {
    console.error('Error removing recipe from book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove recipe from book' },
      { status: 500 }
    );
  }
}