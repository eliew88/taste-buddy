/**
 * Debug Open Graph Metadata API
 * 
 * This endpoint helps debug what Open Graph metadata is being generated
 * for recipes and meals to troubleshoot link preview issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'recipe' or 'meal'
  const id = searchParams.get('id');

  if (!type || !id) {
    return NextResponse.json({
      error: 'Missing required parameters: type and id'
    }, { status: 400 });
  }

  try {
    if (type === 'recipe') {
      const recipe = await prisma.recipe.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          ingredients: {
            select: { ingredient: true },
            take: 5
          },
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1
          },
          author: {
            select: { name: true }
          }
        }
      });

      if (!recipe) {
        return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
      }

      // Simulate the same logic as the metadata generation
      let imageUrl = '';
      if (recipe.images && recipe.images.length > 0) {
        const rawImageUrl = recipe.images[0].url;
        imageUrl = getOptimizedImageUrl(rawImageUrl) || rawImageUrl;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                      process.env.NEXTAUTH_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'https://tastebuddy-3ri413hc1-elis-projects-a122fa34.vercel.app');

      const absoluteImageUrl = imageUrl ? 
        (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`) : 
        null;

      const ingredientNames = recipe.ingredients.map(i => i.ingredient);
      const description = recipe.description || 
        `${recipe.title} recipe${recipe.author?.name ? ` by ${recipe.author.name}` : ''}${ingredientNames.length > 0 ? `. Ingredients: ${ingredientNames.slice(0, 3).join(', ')}${ingredientNames.length > 3 ? '...' : ''}` : ''}.`;

      return NextResponse.json({
        type: 'recipe',
        id: recipe.id,
        title: recipe.title,
        description: description.substring(0, 160),
        rawImageUrl: recipe.images?.[0]?.url || null,
        optimizedImageUrl: imageUrl || null,
        absoluteImageUrl,
        baseUrl,
        hasImage: !!absoluteImageUrl,
        environment: {
          NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || null,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
          VERCEL_URL: process.env.VERCEL_URL || null,
          NODE_ENV: process.env.NODE_ENV,
          B2_PUBLIC_URL: process.env.B2_PUBLIC_URL || null,
          NEXT_PUBLIC_B2_PUBLIC_URL: process.env.NEXT_PUBLIC_B2_PUBLIC_URL || null
        },
        expectedMetadata: {
          title: `${recipe.title} - TasteBuddy`,
          description: description.substring(0, 160),
          openGraph: {
            title: recipe.title,
            description: description.substring(0, 160),
            type: 'website',
            url: `${baseUrl}/recipes/${recipe.id}`,
            siteName: 'TasteBuddy',
            ...(absoluteImageUrl && {
              images: [{
                url: absoluteImageUrl,
                width: 1200,
                height: 630,
                alt: recipe.title,
              }]
            })
          }
        }
      });

    } else if (type === 'meal') {
      const meal = await prisma.meal.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1
          },
          author: {
            select: { name: true }
          }
        }
      });

      if (!meal) {
        return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
      }

      if (!meal.isPublic) {
        return NextResponse.json({ error: 'Meal is private' }, { status: 403 });
      }

      // Simulate the same logic as the metadata generation
      let imageUrl = '';
      if (meal.images && meal.images.length > 0) {
        const rawImageUrl = meal.images[0].url;
        imageUrl = getOptimizedImageUrl(rawImageUrl) || rawImageUrl;
      }

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                      process.env.NEXTAUTH_URL || 
                      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'https://tastebuddy-3ri413hc1-elis-projects-a122fa34.vercel.app');

      const absoluteImageUrl = imageUrl ? 
        (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`) : 
        null;

      let description = meal.description || `${meal.name} meal memory`;
      if (meal.author?.name) {
        description += ` by ${meal.author.name}`;
      }

      return NextResponse.json({
        type: 'meal',
        id: meal.id,
        name: meal.name,
        description: description.substring(0, 160),
        rawImageUrl: meal.images?.[0]?.url || null,
        optimizedImageUrl: imageUrl || null,
        absoluteImageUrl,
        baseUrl,
        hasImage: !!absoluteImageUrl,
        environment: {
          NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || null,
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || null,
          VERCEL_URL: process.env.VERCEL_URL || null,
          NODE_ENV: process.env.NODE_ENV,
          B2_PUBLIC_URL: process.env.B2_PUBLIC_URL || null,
          NEXT_PUBLIC_B2_PUBLIC_URL: process.env.NEXT_PUBLIC_B2_PUBLIC_URL || null
        },
        expectedMetadata: {
          title: `${meal.name} - TasteBuddy`,
          description: description.substring(0, 160),
          openGraph: {
            title: meal.name,
            description: description.substring(0, 160),
            type: 'website',
            url: `${baseUrl}/meals/${meal.id}`,
            siteName: 'TasteBuddy',
            ...(absoluteImageUrl && {
              images: [{
                url: absoluteImageUrl,
                width: 1200,
                height: 630,
                alt: meal.name,
              }]
            })
          }
        }
      });
    }

    return NextResponse.json({ error: 'Invalid type. Use "recipe" or "meal"' }, { status: 400 });

  } catch (error) {
    console.error('Debug OG metadata error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}