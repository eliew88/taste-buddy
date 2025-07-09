/**
 * B2 Connection Test API
 * 
 * Simple endpoint to test B2 connectivity and configuration
 * without uploading any files.
 */

import { NextResponse } from 'next/server';
import { testB2Connection } from '@/lib/b2-storage';

export async function GET() {
  try {
    const result = await testB2Connection();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'B2 configuration is valid',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'B2 configuration failed'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'B2 test failed'
    }, { status: 500 });
  }
}