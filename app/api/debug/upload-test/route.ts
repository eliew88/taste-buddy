/**
 * Debug Upload Test API
 * 
 * This endpoint helps debug image upload issues in production.
 * It tests each step of the upload process separately.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth';
import { testB2Connection } from '@/lib/b2-storage';

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  try {
    // 1. Test Authentication
    debugInfo.checks.auth = { status: 'testing' };
    try {
      const userId = await getCurrentUserId();
      debugInfo.checks.auth = {
        status: userId ? 'success' : 'no_user',
        userId: userId ? 'present' : 'missing'
      };
    } catch (error) {
      debugInfo.checks.auth = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown auth error'
      };
    }

    // 2. Test B2 Configuration
    debugInfo.checks.b2Config = { status: 'testing' };
    try {
      const b2Test = await testB2Connection();
      debugInfo.checks.b2Config = {
        status: b2Test.success ? 'success' : 'error',
        error: b2Test.error || null,
        envVars: {
          B2_ENDPOINT: process.env.B2_ENDPOINT ? 'present' : 'missing',
          B2_ACCESS_KEY_ID: process.env.B2_ACCESS_KEY_ID ? 'present' : 'missing',
          B2_SECRET_ACCESS_KEY: process.env.B2_SECRET_ACCESS_KEY ? 'present' : 'missing',
          B2_BUCKET_NAME: process.env.B2_BUCKET_NAME ? 'present' : 'missing',
          B2_PUBLIC_URL: process.env.B2_PUBLIC_URL ? 'present' : 'missing'
        }
      };
    } catch (error) {
      debugInfo.checks.b2Config = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown B2 config error'
      };
    }

    // 3. Test File System (for fallback)
    debugInfo.checks.fileSystem = { status: 'testing' };
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const uploadDir = path.join(process.cwd(), 'public', 'images', 'recipes');
      
      try {
        await fs.access(uploadDir);
        debugInfo.checks.fileSystem = { status: 'directory_exists' };
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
        debugInfo.checks.fileSystem = { status: 'directory_created' };
      }
    } catch (error) {
      debugInfo.checks.fileSystem = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown file system error'
      };
    }

    // 4. Test Database Connection
    debugInfo.checks.database = { status: 'testing' };
    try {
      const { prisma } = await import('@/lib/db');
      await prisma.$connect();
      debugInfo.checks.database = { status: 'success' };
    } catch (error) {
      debugInfo.checks.database = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: debugInfo
    }, { status: 500 });
  }
}