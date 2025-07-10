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
import { getCurrentUserId } from '@/lib/auth';
import { deleteRecipeImage } from '@/lib/image-utils';

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
            email: true,
            image: true
          },
        },
        ingredients: true,
        _count: {
          select: { 
            favorites: true, 
            ratings: true 
          },
        },
        ratings: {
          select: { rating: true }
        }
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
 * Updates an existing recipe. Only the recipe author can update their recipes.
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
    console.log('=== RECIPE UPDATE START ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const { id } = await params;
    console.log('Recipe ID:', id);
    
    const body = await request.json();
    console.log('Update request body:', JSON.stringify(body, null, 2));

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

    // Authorization check - only recipe author can update
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (existingRecipe.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the recipe author can edit this recipe' },
        { status: 403 }
      );
    }

    const { 
      title, 
      description, 
      ingredients, 
      instructions, 
      cookTime, 
      servings, 
      difficulty, 
      tags,
      image 
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
      console.log('Processing ingredients update:', ingredients);
      if (!ingredients || (Array.isArray(ingredients) && ingredients.length === 0)) {
        console.log('Ingredients validation failed: empty ingredients');
        return NextResponse.json(
          { success: false, error: 'At least one ingredient is required' },
          { status: 400 }
        );
      }
      
      // Validate structured ingredients
      if (Array.isArray(ingredients)) {
        for (let i = 0; i < ingredients.length; i++) {
          const ingredient = ingredients[i];
          if (!ingredient.ingredient?.trim()) {
            console.log(`Ingredients validation failed: Invalid ingredient ${i}`, ingredient);
            return NextResponse.json(
              { success: false, error: 'Each ingredient must have an ingredient name' },
              { status: 400 }
            );
          }
        }
      }
      
      // We can't update ingredients directly in the same query due to Prisma limitations
      // We'll handle ingredients separately after the main update
      console.log('Ingredients will be updated separately after main recipe update');
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
      // PostgreSQL native array support
      updateData.tags = Array.isArray(tags) ? tags : [];
    }

    // Handle image updates
    if (image !== undefined) {
      // If new image is provided, delete old image (if it's a local image)
      if (image && existingRecipe.image && existingRecipe.image !== image) {
        await deleteRecipeImage(existingRecipe.image);
      }
      updateData.image = image || null;
    }

    // Update recipe (without ingredients first)
    console.log('Updating recipe with data:', updateData);
    let updatedRecipe = await prisma.recipe.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            image: true
          },
        },
        ingredients: true,
        _count: {
          select: { 
            favorites: true, 
            ratings: true 
          },
        },
        ratings: {
          select: { rating: true }
        }
      },
    });
    
    console.log('Recipe updated successfully:', {
      id: updatedRecipe.id,
      title: updatedRecipe.title,
      ingredientsCount: updatedRecipe.ingredients.length
    });

    // Handle ingredients update separately if provided
    if (ingredients !== undefined) {
      console.log('Updating ingredients separately...');
      
      // Delete all existing ingredients
      await prisma.ingredientEntry.deleteMany({
        where: { recipeId: id }
      });
      
      // Create new ingredients
      if (Array.isArray(ingredients) && ingredients.length > 0) {
        await prisma.ingredientEntry.createMany({
          data: ingredients.map((ingredient: any) => ({
            recipeId: id,
            amount: ingredient.amount !== undefined && ingredient.amount !== null && ingredient.amount !== '' 
              ? parseFloat(ingredient.amount) 
              : null,
            unit: ingredient.unit?.trim() || null,
            ingredient: ingredient.ingredient.trim(),
          }))
        });
      }
      
      // Fetch updated recipe with new ingredients
      const refreshedRecipe = await prisma.recipe.findUnique({
        where: { id },
        include: {
          author: {
            select: { 
              id: true, 
              name: true, 
              email: true,
              image: true
            },
          },
          ingredients: true,
          _count: {
            select: { 
              favorites: true, 
              ratings: true 
            },
          },
          ratings: {
            select: { rating: true }
          }
        },
      });
      
      if (!refreshedRecipe) {
        throw new Error('Failed to fetch updated recipe');
      }
      
      updatedRecipe = refreshedRecipe;
      
      console.log('Ingredients updated successfully. New count:', updatedRecipe?.ingredients.length || 0);
    }

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

    console.log('Returning successful update response');
    console.log('=== RECIPE UPDATE SUCCESS ===');
    return NextResponse.json({
      success: true,
      data: transformedRecipe,
    });

  } catch (error) {
    console.error('=== RECIPE UPDATE ERROR ===');
    console.error('Error updating recipe:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    });
    console.error('=== END RECIPE UPDATE ERROR ===');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update recipe',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recipes/[id]
 * 
 * Deletes a recipe. Only the recipe author can delete their recipes.
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

    // Authorization check - only recipe author can delete
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (existingRecipe.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the recipe author can delete this recipe' },
        { status: 403 }
      );
    }

    // Delete associated image file if it exists
    if (existingRecipe.image) {
      await deleteRecipeImage(existingRecipe.image);
    }

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