/**
 * Debug Session API Route
 * 
 * Check current session status for debugging upload issues.
 */

import { NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    
    return NextResponse.json({
      success: true,
      authenticated: !!userId,
      userId: userId || null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}