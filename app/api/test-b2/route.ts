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
    console.log('🧪 Testing B2 connection...');
    
    // First check if B2 is configured
    const b2Config = {
      endpoint: process.env.B2_ENDPOINT,
      region: process.env.B2_REGION,
      accessKeyId: process.env.B2_ACCESS_KEY_ID,
      secretAccessKey: process.env.B2_SECRET_ACCESS_KEY,
      bucketName: process.env.B2_BUCKET_NAME,
      publicUrl: process.env.B2_PUBLIC_URL,
    };
    
    const missingVars = Object.entries(b2Config)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingVars.length > 0) {
      console.error('❌ B2 configuration missing:', missingVars);
      return NextResponse.json({
        success: false,
        error: `B2 configuration missing: ${missingVars.join(', ')}`,
        config: Object.fromEntries(
          Object.entries(b2Config).map(([key, value]) => [key, value ? 'Set' : 'Missing'])
        )
      }, { status: 500 });
    }
    
    const result = await testB2Connection();
    
    if (result.success) {
      console.log('✅ B2 connection successful');
      return NextResponse.json({
        success: true,
        message: 'B2 configuration is valid',
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ B2 connection failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        message: 'B2 configuration failed'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ B2 test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'B2 test failed'
    }, { status: 500 });
  }
}