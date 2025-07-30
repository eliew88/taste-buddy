/**
 * Individual Meal API Route
 * 
 * Handles operations for individual meals by ID.
 * Supports GET (retrieve), PUT (update), and DELETE operations.
 * 
 * Location: app/api/meals/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';
import { evaluateMealAchievements, evaluatePhotoAchievements } from '@/lib/achievement-service';

/**
 * GET /api/meals/[id]
 * 
 * Fetches a single meal by ID with all related data including
 * author information and images.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing the meal ID
 * @returns JSON response with meal data or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Fetch meal with all related data
    const meal = await prisma.meal.findUnique({
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
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        taggedUsers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      },
    });

    if (!meal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: meal,
    });

  } catch (error) {
    console.error('Error fetching meal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch meal' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/meals/[id]
 * 
 * Updates an existing meal. Only the meal author can update their meals.
 * 
 * @param request - Next.js request object with meal data
 * @param params - Route parameters containing the meal ID
 * @returns JSON response with updated meal data or error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== MEAL UPDATE START ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const { id } = await params;
    console.log('Meal ID:', id);
    
    const body = await request.json();
    console.log('Update request body:', JSON.stringify(body, null, 2));

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Check if meal exists
    const existingMeal = await prisma.meal.findUnique({
      where: { id },
    });

    if (!existingMeal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Authorization check - only meal author can update
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (existingMeal.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the meal author can edit this meal' },
        { status: 403 }
      );
    }

    const { 
      name, 
      description, 
      date,
      images
    } = body;

    // Prepare update data (only include provided fields)
    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { success: false, error: 'Meal name cannot be empty' },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (date !== undefined) {
      updateData.date = date ? new Date(date) : null;
    }

    // Handle images updates
    let shouldUpdateImages = false;
    if (images !== undefined) {
      console.log('Images update requested:', images);
      shouldUpdateImages = true;
      
      // Validate images array
      if (images && Array.isArray(images)) {
        // Filter out images without valid URLs for validation
        const validImages = images.filter((img: any) => img.url && img.url.trim() !== '');
        
        // Ensure only one primary image among valid images
        const primaryImages = validImages.filter((img: any) => img.isPrimary === true);
        if (primaryImages.length > 1) {
          return NextResponse.json(
            { success: false, error: 'Only one image can be marked as primary' },
            { status: 400 }
          );
        }
        
        // If no primary image is specified among valid images, make the first valid one primary
        if (primaryImages.length === 0 && validImages.length > 0) {
          const firstValidImage = images.find((img: any) => img.url && img.url.trim() !== '');
          if (firstValidImage) {
            firstValidImage.isPrimary = true;
          }
        }
      }
    }

    // Update meal
    console.log('Updating meal with data:', updateData);
    let updatedMeal = await prisma.meal.update({
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
        images: {
          orderBy: { displayOrder: 'asc' }
        },
        taggedUsers: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      },
    });
    
    console.log('Meal updated successfully:', {
      id: updatedMeal.id,
      name: updatedMeal.name,
      imagesCount: updatedMeal.images?.length || 0
    });

    // Handle images update separately if provided
    if (shouldUpdateImages) {
      console.log('Updating images separately...');
      
      // Delete all existing images for this meal
      await prisma.mealImage.deleteMany({
        where: { mealId: id }
      });
      
      // Create new images if provided
      if (Array.isArray(images) && images.length > 0) {
        // Filter out images without valid URLs
        const validImages = images.filter((img: any) => img.url && img.url.trim() !== '');
        
        if (validImages.length > 0) {
          await prisma.mealImage.createMany({
            data: validImages.map((img: any, index: number) => ({
              mealId: id,
              url: img.url,
              filename: img.filename || null,
              caption: img.caption || null,
              alt: img.alt || null,
              width: img.width || null,
              height: img.height || null,
              fileSize: img.fileSize || null,
              displayOrder: img.displayOrder !== undefined ? img.displayOrder : index,
              isPrimary: img.isPrimary === true
            }))
          });
        }
      }
      
      // Fetch updated meal with new images
      const refreshedMeal = await prisma.meal.findUnique({
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
          images: {
            orderBy: { displayOrder: 'asc' }
          },
          taggedUsers: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true }
              }
            }
          }
        },
      });
      
      if (!refreshedMeal) {
        throw new Error('Failed to fetch updated meal');
      }
      
      updatedMeal = refreshedMeal;
      
      console.log('Images updated successfully. New count:', updatedMeal?.images?.length || 0);
    }

    console.log('Returning successful update response');
    console.log('=== MEAL UPDATE SUCCESS ===');
    return NextResponse.json({
      success: true,
      data: updatedMeal,
    });

  } catch (error) {
    console.error('=== MEAL UPDATE ERROR ===');
    console.error('Error updating meal:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
    });
    console.error('=== END MEAL UPDATE ERROR ===');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update meal',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/meals/[id]
 * 
 * Deletes a meal. Only the meal author can delete their meals.
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing the meal ID
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
        { success: false, error: 'Meal ID is required' },
        { status: 400 }
      );
    }

    // Check if meal exists
    const existingMeal = await prisma.meal.findUnique({
      where: { id },
    });

    if (!existingMeal) {
      return NextResponse.json(
        { success: false, error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Authorization check - only meal author can delete
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (existingMeal.authorId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Only the meal author can delete this meal' },
        { status: 403 }
      );
    }

    // Store author ID before deletion for achievement evaluation
    const authorId = existingMeal.authorId;
    
    // Delete meal (this will also delete related images due to CASCADE)
    await prisma.meal.delete({
      where: { id },
    });

    // Evaluate achievements after meal deletion
    try {
      console.log('Evaluating achievements for meal deletion...');
      
      // Re-evaluate meal count achievements (count may have decreased)
      const mealAchievements = await evaluateMealAchievements(authorId);
      
      // Re-evaluate photo achievements (photo count may have decreased)
      const photoAchievements = await evaluatePhotoAchievements(authorId);
      
      console.log('Achievement evaluation completed after meal deletion');
      
    } catch (error) {
      console.error('Failed to evaluate achievements after meal deletion:', error);
      // Don't fail the deletion if achievement evaluation fails
    }

    return NextResponse.json({
      success: true,
      message: 'Meal deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting meal:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete meal' },
      { status: 500 }
    );
  }
}