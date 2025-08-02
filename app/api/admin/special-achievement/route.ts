/**
 * Special Achievement Admin API
 * 
 * This API endpoint is for creating and awarding special achievements.
 * It should only be used by administrators.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUserId } from '@/lib/auth';

/**
 * POST - Create and award the special "Best Girlfriend" achievement to user "a k"
 */
export async function POST(request: NextRequest) {
  try {
    // Admin endpoint - no authentication required for administrative tasks

    // Get the special user ID from environment variable
    const specialUserId = process.env.SPECIAL_USER_ID;
    
    if (!specialUserId) {
      return NextResponse.json(
        { success: false, error: 'Special user ID not configured' },
        { status: 500 }
      );
    }

    // Find the special user by ID
    const targetUser = await prisma.user.findUnique({
      where: {
        id: specialUserId
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Special user not found' },
        { status: 404 }
      );
    }

    console.log(`Found target user: ${targetUser.name} (${targetUser.id})`);

    // Check if the "Best Girlfriend" achievement already exists
    let achievement = await prisma.achievement.findFirst({
      where: {
        name: 'Best Girlfriend',
        type: 'SPECIAL'
      }
    });

    // Create the achievement if it doesn't exist
    if (!achievement) {
      achievement = await prisma.achievement.create({
        data: {
          type: 'SPECIAL',
          name: 'Best Girlfriend',
          description: 'Awarded to the most amazing girlfriend ever! 💕',
          icon: '👑', // Crown emoji
          color: '#FF69B4', // Hot pink color
          threshold: null, // No threshold for special achievements
          isActive: true
        }
      });

      console.log(`Created special achievement: ${achievement.name} (${achievement.id})`);
    } else {
      console.log(`Achievement already exists: ${achievement.name} (${achievement.id})`);
    }

    // Check if the user already has this achievement
    const existingUserAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: targetUser.id,
          achievementId: achievement.id
        }
      }
    });

    if (existingUserAchievement) {
      return NextResponse.json({
        success: true,
        message: `User "${targetUser.name}" already has the "Best Girlfriend" achievement`,
        data: {
          user: targetUser.name,
          achievement: achievement.name,
          earnedAt: existingUserAchievement.earnedAt
        }
      });
    }

    // Award the achievement to the user
    const userAchievement = await prisma.userAchievement.create({
      data: {
        userId: targetUser.id,
        achievementId: achievement.id,
        progress: null // Special achievements don't have progress
      }
    });

    console.log(`Awarded achievement "${achievement.name}" to user "${targetUser.name}"`);

    return NextResponse.json({
      success: true,
      message: `Successfully awarded "Best Girlfriend" achievement to ${targetUser.name}!`,
      data: {
        user: targetUser.name,
        achievement: achievement.name,
        earnedAt: userAchievement.earnedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating/awarding special achievement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create/award special achievement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check if the special achievement exists and if user "a k" has it
 */
export async function GET(request: NextRequest) {
  try {
    // Get the special user ID from environment variable
    const specialUserId = process.env.SPECIAL_USER_ID;
    
    if (!specialUserId) {
      return NextResponse.json(
        { success: false, error: 'Special user ID not configured' },
        { status: 500 }
      );
    }

    // Find the special user by ID
    const targetUser = await prisma.user.findUnique({
      where: {
        id: specialUserId
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'Special user not found' },
        { status: 404 }
      );
    }

    // Check if the achievement exists
    const achievement = await prisma.achievement.findFirst({
      where: {
        name: 'Best Girlfriend',
        type: 'SPECIAL'
      }
    });

    if (!achievement) {
      return NextResponse.json({
        success: true,
        data: {
          user: targetUser.name,
          achievementExists: false,
          userHasAchievement: false
        }
      });
    }

    // Check if user has the achievement
    const userAchievement = await prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId: targetUser.id,
          achievementId: achievement.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        user: targetUser.name,
        achievementExists: true,
        userHasAchievement: !!userAchievement,
        achievement: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          color: achievement.color
        },
        earnedAt: userAchievement?.earnedAt || null
      }
    });

  } catch (error) {
    console.error('Error checking special achievement:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check special achievement',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}