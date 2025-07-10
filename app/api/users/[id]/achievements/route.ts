import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ACHIEVEMENT_CRITERIA } from '@/prisma/achievements-seed';

// GET /api/users/[id]/achievements - Get user's achievements
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    
    // Get user's earned achievements
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: {
        earnedAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: userAchievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users/[id]/achievements - Evaluate and award achievements
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: userId } = await params;
    
    // Only allow users to evaluate their own achievements or admin functionality
    if (session.user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all active achievements
    const achievements = await prisma.achievement.findMany({
      where: { isActive: true }
    });

    // Get user's current achievements to avoid duplicates
    const existingAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true }
    });
    const existingAchievementIds = new Set(existingAchievements.map(ua => ua.achievementId));

    const newAchievements = [];

    // Evaluate each achievement
    for (const achievement of achievements) {
      // Skip if user already has this achievement
      if (existingAchievementIds.has(achievement.id)) {
        continue;
      }

      let earned = false;
      let progress = 0;

      switch (achievement.type) {
        case 'RECIPE_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.RECIPE_COUNT.evaluate(userId);
          earned = progress >= achievement.threshold;
          break;

        case 'FAVORITES_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.FAVORITES_COUNT.evaluate(userId);
          earned = progress >= achievement.threshold;
          break;

        case 'FOLLOWERS_COUNT':
          progress = await ACHIEVEMENT_CRITERIA.FOLLOWERS_COUNT.evaluate(userId);
          earned = progress >= achievement.threshold;
          break;

        case 'RATINGS_COUNT':
          if (achievement.name === '5-Star Chef') {
            progress = await ACHIEVEMENT_CRITERIA.RATINGS_COUNT['5-Star Chef'](userId);
            earned = progress >= achievement.threshold;
          } else if (achievement.name === 'Consistent Quality') {
            progress = await ACHIEVEMENT_CRITERIA.RATINGS_COUNT['Consistent Quality'](userId);
            earned = progress >= achievement.threshold;
          }
          break;

        case 'SPECIAL':
          if (achievement.name === 'BFF') {
            progress = await ACHIEVEMENT_CRITERIA.SPECIAL.BFF(userId);
            earned = progress >= achievement.threshold;
          }
          break;
      }

      // Award achievement if earned
      if (earned) {
        const userAchievement = await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            progress: progress,
            earnedAt: new Date()
          },
          include: {
            achievement: true
          }
        });
        
        newAchievements.push(userAchievement);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        newAchievements,
        message: newAchievements.length > 0 
          ? `Congratulations! You earned ${newAchievements.length} new achievement${newAchievements.length !== 1 ? 's' : ''}!`
          : 'No new achievements earned at this time.'
      }
    });
  } catch (error) {
    console.error('Evaluate achievements error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}