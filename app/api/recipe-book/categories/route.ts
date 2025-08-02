/**
 * Recipe Book Categories API Route
 * 
 * Manages user-defined categories for organizing recipes in their recipe book.
 * Supports creating, reading, updating, and deleting categories.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * GET - Fetch all categories for the authenticated user
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's categories with recipe count
    const categories = await prisma.recipeBookCategory.findMany({
      where: {
        userId: userId
      },
      include: {
        _count: {
          select: {
            recipeBookEntries: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform data to include recipe count
    const transformedCategories = categories.map(category => ({
      ...category,
      recipeCount: category._count.recipeBookEntries,
      _count: undefined
    }));

    return NextResponse.json({
      success: true,
      data: transformedCategories,
    });

  } catch (error) {
    console.error('Error fetching recipe book categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new category for the authenticated user
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
    const { name, description, color } = body;

    // Validation
    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check for duplicate category names
    const existingCategory = await prisma.recipeBookCategory.findUnique({
      where: {
        userId_name: {
          userId: userId,
          name: name.trim()
        }
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { success: false, error: 'A category with this name already exists' },
        { status: 409 }
      );
    }

    // Create the category
    const category = await prisma.recipeBookCategory.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color?.trim() || null,
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

    // Transform response
    const transformedCategory = {
      ...category,
      recipeCount: category._count.recipeBookEntries,
      _count: undefined
    };

    return NextResponse.json(
      { 
        success: true, 
        data: transformedCategory 
      }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating recipe book category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a category for the authenticated user (only if empty)
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

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

    // Check if category is empty
    if (category._count.recipeBookEntries > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category that contains recipes' },
        { status: 400 }
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