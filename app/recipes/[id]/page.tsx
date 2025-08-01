import RecipeDetailClient from './recipe-detail-client';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';
import { isB2Url } from '@/lib/image-optimization';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const recipeId = resolvedParams.id;
  
  try {
    // Fetch recipe data for metadata
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        title: true,
        description: true,
        ingredients: {
          select: {
            ingredient: true
          },
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
      return {
        title: 'Recipe Not Found - TasteBuddy',
        description: 'The requested recipe could not be found.'
      };
    }

    // Get the primary image or first available image
    let imageUrl = '';
    if (recipe.images && recipe.images.length > 0) {
      const rawImageUrl = recipe.images[0].url;
      // Optimize the image for Open Graph
      imageUrl = getOptimizedImageUrl(rawImageUrl) || rawImageUrl;
      
      // Debug logging for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Recipe OG Image Debug:', {
          recipeId,
          rawImageUrl,
          optimizedUrl: getOptimizedImageUrl(rawImageUrl),
          finalUrl: imageUrl
        });
      }
    }

    // Create a proper description
    const ingredientNames = recipe.ingredients.map(i => i.ingredient);
    const description = recipe.description || 
      `${recipe.title} recipe${recipe.author?.name ? ` by ${recipe.author.name}` : ''}${ingredientNames.length > 0 ? `. Ingredients: ${ingredientNames.slice(0, 3).join(', ')}${ingredientNames.length > 3 ? '...' : ''}` : ''}.`;

    // Get the base URL from environment variables
    // Prioritize VERCEL_URL (current deployment) over NEXTAUTH_URL (can be outdated)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                     process.env.NEXTAUTH_URL) || 
                    'https://tastebuddy-nikmf9xxu-elis-projects-a122fa34.vercel.app';

    // Prepare Open Graph metadata
    const metadata: any = {
      title: `${recipe.title} - TasteBuddy`,
      description: description.substring(0, 160), // Keep description under 160 chars
      openGraph: {
        title: recipe.title,
        description: description.substring(0, 160),
        type: 'website',
        url: `${baseUrl}/recipes/${recipeId}`,
        siteName: 'TasteBuddy',
      }
    };

    // Only add image if we have a valid image URL
    if (imageUrl) {
      // Ensure we have an absolute URL for the image
      let absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
      
      // Use image proxy for B2 images to ensure WhatsApp compatibility
      if (isB2Url(absoluteImageUrl)) {
        absoluteImageUrl = `${baseUrl}/api/og-image?url=${encodeURIComponent(absoluteImageUrl)}`;
      }
      
      metadata.openGraph.images = [{
        url: absoluteImageUrl,
        width: 1200,
        height: 630,
        alt: recipe.title,
      }];
      
      // Also add basic meta tags
      metadata.other = {
        'og:image:secure_url': absoluteImageUrl,
      };
    }

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Recipe - TasteBuddy',
      description: 'Discover and share amazing recipes on TasteBuddy.'
    };
  }
}

export default function RecipeDetailPage(props: PageProps) {
  return <RecipeDetailClient />;
}