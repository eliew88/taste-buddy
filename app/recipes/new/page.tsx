/**
 * Recipe Creation Page
 * 
 * The main page for creating new recipes. Provides a clean interface
 * with navigation and the recipe creation form.
 * 
 * Location: app/recipes/new/page.tsx
 * 
 * Features:
 * - Full-page recipe creation form
 * - Navigation integration
 * - Error boundary protection
 * - Success/error handling
 * - Responsive design
 */

'use client';

import Navigation from '@/components/ui/Navigation';
import RecipeForm from '@/components/recipe-form';
import ErrorBoundary from '@/components/error-boundary';

/**
 * New Recipe Page Component
 * 
 * Renders the recipe creation interface with proper navigation
 * and form handling. Provides a clean, focused environment
 * for recipe creation.
 */
export default function NewRecipePage() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Navigation */}
        <Navigation />
        
        {/* Main Content */}
        <main>
          <RecipeForm />
        </main>
      </div>
    </ErrorBoundary>
  );
}