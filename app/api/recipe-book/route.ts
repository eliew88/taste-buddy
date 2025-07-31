/**
 * Recipe Book API Route
 * 
 * Manages the main recipe book functionality including viewing all recipes
 * in the user's book, with optional category filtering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET - Fetch all recipes in user's recipe book with optional category filtering
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

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')));
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: userId
    };

    // Add category filter if specified
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Fetch recipe book entries with recipes
    const [entries, totalCount] = await Promise.all([
      prisma.recipeBookEntry.findMany({
        where,
        include: {
          recipe: {
            include: {
              author: {
                select: { id: true, name: true, email: true, image: true }
              },
              images: {
                orderBy: { displayOrder: 'asc' }
              },
              _count: {
                select: { favorites: true, ratings: true, comments: true }
              },
              ratings: {
                select: { rating: true }
              }
            }
          },
          category: {
            select: { id: true, name: true, color: true }
          }
        },
        orderBy: {
          addedAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.recipeBookEntry.count({ where })
    ]);

    // Transform the data
    const transformedEntries = entries.map(entry => {
      const recipe = entry.recipe;
      
      // Calculate average rating
      const totalRating = recipe.ratings.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = recipe.ratings.length > 0 ? totalRating / recipe.ratings.length : 0;

      return {
        ...recipe,
        addedAt: entry.addedAt,
        notes: entry.notes,
        category: entry.category,
        avgRating: Math.round(avgRating * 10) / 10,
        ratings: undefined // Remove ratings array from response
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedEntries,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching recipe book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipe book' },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a recipe to the user's recipe book
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { recipeId, categoryIds, notes } = body;

    // Validation
    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

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

    // If no categories specified, add recipe without category
    if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      // Check if recipe is already in book without category
      const existingEntry = await prisma.recipeBookEntry.findFirst({
        where: {
          userId,
          recipeId,
          categoryId: null
        }
      });

      if (existingEntry) {
        return NextResponse.json(
          { success: false, error: 'Recipe is already in your recipe book' },
          { status: 409 }
        );
      }

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
      // Verify all categories belong to the user
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

      // Check for existing entries and create new ones
      const existingEntries = await prisma.recipeBookEntry.findMany({
        where: {
          userId,
          recipeId,
          categoryId: { in: categoryIds }
        }
      });

      const existingCategoryIds = existingEntries.map(entry => entry.categoryId);
      const newCategoryIds = categoryIds.filter(id => !existingCategoryIds.includes(id));

      if (newCategoryIds.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Recipe is already in the selected categories' },
          { status: 409 }
        );
      }

      // Create entries for new categories
      await prisma.recipeBookEntry.createMany({
        data: newCategoryIds.map(categoryId => ({
          userId,
          recipeId,
          categoryId,
          notes: notes?.trim() || null
        }))
      });
    }

    return NextResponse.json(
      { 
        success: true, 
        message: 'Recipe added to recipe book successfully' 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Error adding recipe to book:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add recipe to book' },
      { status: 500 }
    );
  }
}