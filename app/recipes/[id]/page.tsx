import RecipeDetailClient from './recipe-detail-client';
import { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { getOptimizedImageUrl } from '@/lib/image-client-utils';

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
      imageUrl = recipe.images[0].url;
    }

    // Optimize the image for Open Graph
    if (imageUrl) {
      imageUrl = getOptimizedImageUrl(imageUrl) || imageUrl;
    }

    // Create a proper description
    const ingredientNames = recipe.ingredients.map(i => i.ingredient);
    const description = recipe.description || 
      `${recipe.title} recipe${recipe.author?.name ? ` by ${recipe.author.name}` : ''}${ingredientNames.length > 0 ? `. Ingredients: ${ingredientNames.slice(0, 3).join(', ')}${ingredientNames.length > 3 ? '...' : ''}` : ''}.`;

    // Get the base URL from environment or use production URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.NEXTAUTH_URL || 
                    'https://tastebuddy.vercel.app';

    // Ensure we have an absolute URL for the image
    const absoluteImageUrl = imageUrl ? 
      (imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`) : 
      `${baseUrl}/images/recipe-placeholder.jpg`; // Add a default OG image

    return {
      title: `${recipe.title} - TasteBuddy`,
      description: description.substring(0, 160), // Keep description under 160 chars
      openGraph: {
        title: recipe.title,
        description: description.substring(0, 160),
        type: 'website',
        url: `${baseUrl}/recipes/${recipeId}`,
        images: [
          {
            url: absoluteImageUrl,
            width: 1200,
            height: 630,
            alt: recipe.title,
          }
        ],
        siteName: 'TasteBuddy',
      },
      // Also add basic meta tags
      other: {
        'og:image:secure_url': absoluteImageUrl,
      }
    };
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