import MealDetailClient from './meal-detail-client';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const mealId = resolvedParams.id;
  
  try {
    // Fetch meal data for metadata
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      select: {
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
        },
        taggedUsers: {
          select: {
            user: {
              select: { name: true }
            }
          },
          take: 3
        }
      }
    });

    if (!meal) {
      return {
        title: 'Meal Not Found - TasteBuddy',
        description: 'The requested meal memory could not be found.'
      };
    }

    // Only show metadata for public meals
    if (!meal.isPublic) {
      return {
        title: 'Private Meal - TasteBuddy',
        description: 'This meal memory is private.'
      };
    }

    // Get the primary meal image or first available image
    let imageUrl = '';
    if (meal.images && meal.images.length > 0) {
      const rawImageUrl = meal.images[0].url;
      // Optimize the image for Open Graph
      imageUrl = getOptimizedImageUrl(rawImageUrl) || rawImageUrl;
      
      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Meal OG Image Debug:', {
          mealId,
          rawImageUrl,
          optimizedUrl: getOptimizedImageUrl(rawImageUrl),
          finalUrl: imageUrl
        });
      }
    }

    // Create description including tagged users
    let description = meal.description || `${meal.name} meal memory`;
    if (meal.author?.name) {
      description += ` by ${meal.author.name}`;
    }
    if (meal.taggedUsers && meal.taggedUsers.length > 0) {
      const taggedNames = meal.taggedUsers.map(t => t.user.name).filter(Boolean);
      if (taggedNames.length > 0) {
        description += ` with ${taggedNames.join(', ')}`;
      }
    }

    // Get the base URL from environment or use production URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.NEXTAUTH_URL || 
                    'https://tastebuddy-8zwrbfgw8-elis-projects-a122fa34.vercel.app';

    // Prepare Open Graph metadata
    const metadata: any = {
      title: `${meal.name} - TasteBuddy`,
      description: description.substring(0, 160), // Keep description under 160 chars
      openGraph: {
        title: meal.name,
        description: description.substring(0, 160),
        type: 'website',
        url: `${baseUrl}/meals/${mealId}`,
        siteName: 'TasteBuddy',
      }
    };

    // Only add image if we have a valid image URL
    if (imageUrl) {
      // Ensure we have an absolute URL for the image
      const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
      
      metadata.openGraph.images = [{
        url: absoluteImageUrl,
        width: 1200,
        height: 630,
        alt: meal.name,
      }];
      
      // Also add basic meta tags
      metadata.other = {
        'og:image:secure_url': absoluteImageUrl,
      };
    }

    return metadata;
  } catch (error) {
    console.error('Error generating meal metadata:', error);
    return {
      title: 'Meal Memory - TasteBuddy',
      description: 'Discover and share amazing meal memories on TasteBuddy.'
    };
  }
}

export default function MealDetailPage(props: PageProps) {
  return <MealDetailClient />;
}