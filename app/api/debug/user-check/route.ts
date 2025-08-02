/**
 * Debug User Check API
 * 
 * This debug endpoint checks if we can find the special user in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const specialUserId = process.env.SPECIAL_USER_ID;
    
    if (!specialUserId) {
      return NextResponse.json({
        success: false,
        error: 'SPECIAL_USER_ID environment variable not set',
        debug: {
          hasSpecialUserId: false,
          nodeEnv: process.env.NODE_ENV,
          databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET'
        }
      });
    }

    // Try to find the user
    const targetUser = await prisma.user.findUnique({
      where: {
        id: specialUserId
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    });

    // Also get a count of total users
    const totalUsers = await prisma.user.count();

    return NextResponse.json({
      success: true,
      debug: {
        specialUserId,
        userFound: !!targetUser,
        targetUser,
        totalUsers,
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('Debug user check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        specialUserId: process.env.SPECIAL_USER_ID ? 'SET' : 'NOT SET'
      }
    }, { status: 500 });
  }
}