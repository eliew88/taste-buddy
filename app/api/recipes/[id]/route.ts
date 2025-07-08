/**
 * Individual Recipe API Route
 * 
 * Handles operations for individual recipes by ID.
 * Supports GET (retrieve), PUT (update), and DELETE operations.
 * 
 * Location: app/api/recipes/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/recipes/[id]
 * 
 * Fetches a single recipe by ID with all related data including
 * author information, ratings count, and favorites count.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing the recipe ID
 * @returns JSON response with recipe data or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Fetch recipe with all related data
    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        author: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          },
        },
        _count: {
          select: { 
            favorites: true, 
            ratings: true 
          },
        },
        // TODO: Include actual ratings when rating system is implemented
        // ratings: {
        //   select: { rating: true }
        // }
      },
    });

    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // PostgreSQL native arrays need no transformation
    const transformedRecipe = {
      ...recipe,
      // Calculate actual average rating from ratings
      avgRating: recipe.ratings.length > 0 
        ? recipe.ratings.reduce((sum, r) => sum + r.rating, 0) / recipe.ratings.length
        : 0,
      // Remove ratings array from response
      ratings: undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedRecipe,
    });

  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/recipes/[id]
 * 
 * Updates an existing recipe. Only the recipe author should be able
 * to update their recipes (TODO: implement authorization).
 * 
 * @param request - Next.js request object with recipe data
 * @param params - Route parameters containing the recipe ID
 * @returns JSON response with updated recipe data or error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // TODO: Add authorization check
    // Verify that the current user is the author of the recipe
    // if (existingRecipe.authorId !== currentUserId) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 403 }
    //   );
    // }

    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookTime, 
      servings, 
      difficulty, 
      tags 
    } = body;

    // Prepare update data (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { success: false, error: 'Recipe title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (ingredients !== undefined) {
      if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0)) {
        return NextResponse.json(
          { success: false, error: 'At least one ingredient is required' },
          { status: 400 }
        );
      }
      updateData.ingredients = JSON.stringify(ingredients);
    }

    if (instructions !== undefined) {
      if (!instructions?.trim()) {
        return NextResponse.json(
          { success: false, error: 'Cooking instructions are required' },
          { status: 400 }
        );
      }
      updateData.instructions = instructions.trim();
    }

    if (cookTime !== undefined) {
      updateData.cookTime = cookTime?.trim() || null;
    }

    if (servings !== undefined) {
      updateData.servings = servings ? Math.max(1, parseInt(servings)) : null;
    }

    if (difficulty !== undefined) {
      if (!['easy', 'medium', 'hard'].includes(difficulty)) {
        return NextResponse.json(
          { success: false, error: 'Difficulty must be easy, medium, or hard' },
          { status: 400 }
        );
      }
      updateData.difficulty = difficulty;
    }

    if (tags !== undefined) {
      updateData.tags = JSON.stringify(tags || []);
    }

    // Update recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { 
            id: true, 
            name: true, 
            email: true 
          },
        },
        _count: {
          select: { 
            favorites: true, 
            ratings: true 
          },
        },
      },
    });

    // PostgreSQL native arrays need no transformation
    const transformedRecipe = {
      ...updatedRecipe,
      // Calculate actual average rating from ratings
      avgRating: updatedRecipe.ratings?.length > 0 
        ? updatedRecipe.ratings.reduce((sum, r) => sum + r.rating, 0) / updatedRecipe.ratings.length
        : 0,
      // Remove ratings array from response
      ratings: undefined,
    };

    return NextResponse.json({
      success: true,
      data: transformedRecipe,
    });

  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
 * 
 * Deletes a recipe. Only the recipe author should be able to delete
 * their recipes (TODO: implement authorization).
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing the recipe ID
 * @returns JSON response confirming deletion or error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Check if recipe exists
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id },
    });

    if (!existingRecipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    // TODO: Add authorization check
    // Verify that the current user is the author of the recipe
    // if (existingRecipe.authorId !== currentUserId) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 403 }
    //   );
    // }

    // Delete recipe (this will also delete related favorites and ratings due to CASCADE)
    await prisma.recipe.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Recipe deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}