/**
 * Recipe Book Category Management API Route
 * 
 * Handles individual category operations (GET, PUT, DELETE).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET - Fetch a specific category with its recipes
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;

    const category = await prisma.recipeBookCategory.findFirst({
      where: {
        id: categoryId,
        userId: userId // Ensure user can only access their own categories
      },
      include: {
        recipeBookEntries: {
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
                }
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        },
        _count: {
          select: {
            recipeBookEntries: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Transform the response
    const transformedCategory = {
      ...category,
      recipes: category.recipeBookEntries.map(entry => ({
        ...entry.recipe,
        addedAt: entry.addedAt,
        notes: entry.notes
      })),
      recipeCount: category._count.recipeBookEntries,
      recipeBookEntries: undefined,
      _count: undefined
    };

    return NextResponse.json({
      success: true,
      data: transformedCategory,
    });

  } catch (error) {
    console.error('Error fetching recipe book category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update a category (name, description, color)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;
    const body = await request.json();
    const { name, description, color } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category exists and belongs to user
    const existingCategory = await prisma.recipeBookCategory.findFirst({
      where: {
        id: categoryId,
        userId: userId
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check for duplicate names (excluding current category)
    const duplicateCategory = await prisma.recipeBookCategory.findFirst({
      where: {
        userId: userId,
        name: name.trim(),
        id: { not: categoryId }
      }
    });

    if (duplicateCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Update the category
    const updatedCategory = await prisma.recipeBookCategory.update({
      where: {
        id: categoryId
      },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
      },
      include: {
        _count: {
          select: {
            recipeBookEntries: true
          }
        }
      }
    });

    // Transform response
    const transformedCategory = {
      ...updatedCategory,
      recipeCount: updatedCategory._count.recipeBookEntries,
      _count: undefined
    };

    return NextResponse.json({
      success: true,
      data: transformedCategory,
    });

  } catch (error) {
    console.error('Error updating recipe book category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a category (only if it has no recipes)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: categoryId } = await params;

    // Check if category exists and belongs to user
    const category = await prisma.recipeBookCategory.findFirst({
      where: {
        id: categoryId,
        userId: userId
      },
      include: {
        _count: {
          select: {
            recipeBookEntries: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if category has recipes
    if (category._count.recipeBookEntries > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete category that contains recipes. Remove all recipes from this category first.' 
        },
        { status: 409 }
      );
    }

    // Delete the category
    await prisma.recipeBookCategory.delete({
      where: {
        id: categoryId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting recipe book category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}