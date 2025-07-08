/**
 * Database Test API Route
 * 
 * Simple endpoint to test database connectivity and debug issues.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    console.log('[DB Test] Starting database connectivity test');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log('[DB Test] User count:', userCount);
    
    // Test if we can query users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
      take: 5,
    });
    console.log('[DB Test] Sample users found:', users.length);
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      userCount,
      sampleUsers: users,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[DB Test] Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}