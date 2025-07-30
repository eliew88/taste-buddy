/**
 * Open Graph Image Proxy API
 * 
 * This endpoint serves as a proxy for images to ensure they work
 * properly with WhatsApp and other social media platforms.
 * 
 * It works around B2/Backblaze limitations that prevent WhatsApp
 * from automatically loading images in link previews.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  try {
    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // Validate it's a valid URL
    const url = new URL(decodedUrl);
    
    // Only allow specific domains for security
    const allowedDomains = [
      'backblazeb2.com',
      'b2cdn.com',
      'unsplash.com',
      'images.unsplash.com'
    ];
    
    const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));
    if (!isAllowed) {
      return new NextResponse('Invalid image domain', { status: 403 });
    }

    // Fetch the image
    const imageResponse = await fetch(decodedUrl);
    
    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: imageResponse.status });
    }

    // Get the image data
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Check size - if over 5MB, we should really optimize it
    // But for now, we'll serve it with better headers
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Return the image with WhatsApp-friendly headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        // These headers help with WhatsApp compatibility
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
        // Force browser to treat as image
        'Content-Disposition': 'inline',
      },
    });
    
  } catch (error) {
    console.error('Error proxying image:', error);
    return new NextResponse('Error processing image', { status: 500 });
  }
}

/**
 * Note: This is a simple proxy implementation.
 * For production, consider:
 * 
 * 1. Image optimization with Sharp:
 *    - Resize to max 1200x630
 *    - Compress to ~1MB
 *    - Convert to JPEG for better compatibility
 * 
 * 2. Caching layer:
 *    - Cache optimized images in Vercel Edge Cache
 *    - Or use Redis/S3 for persistent cache
 * 
 * 3. Security enhancements:
 *    - Rate limiting
 *    - Request signing
 *    - More strict domain validation
 */