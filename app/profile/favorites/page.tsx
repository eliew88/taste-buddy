/**
 * Legacy Favorites Page - Deprecated
 * 
 * This page has been deprecated in favor of the new Recipe Book system.
 * Redirects users to the Recipe Book page which provides enhanced functionality.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen } from 'lucide-react';
import Navigation from '@/components/ui/Navigation';

export default function FavoritesPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Recipe Book after a short delay to show the migration message
    const timer = setTimeout(() => {
      router.push('/profile/recipe-book');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRedirectNow = () => {
    router.push('/profile/recipe-book');
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="mb-8">
            <BookOpen className="w-16 h-16 text-green-700 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Favorites Has Been Upgraded!
            </h1>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Your favorites have been upgraded to our new <strong>Recipe Book</strong> system! 
              The Recipe Book offers enhanced organization with custom categories, notes, and better management tools.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold text-green-800 mb-2">What's New:</h2>
              <ul className="text-left text-green-700 space-y-2">
                <li>• Organize recipes into custom categories</li>
                <li>• Add personal notes to recipes</li>
                <li>• Better search and filtering</li>
                <li>• Your existing favorites are safely preserved</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleRedirectNow}
                className="bg-green-700 text-white px-8 py-3 rounded-lg hover:bg-green-800 transition-colors font-semibold"
              >
                Go to Recipe Book Now
              </button>
              
              <div className="flex items-center text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Redirecting automatically in a few seconds...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}