# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TasteBuddy is a Next.js 15 recipe sharing platform built with TypeScript, Tailwind CSS, and Prisma ORM. The application uses PostgreSQL for both development and production, and follows a typical Next.js App Router structure with API routes.

## Development Commands

- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality
- `npm run db:seed` - Seed the database with sample data using prisma/seed.ts

## Feature Flags

The application includes a feature flag system for enabling/disabling functionality in production:

### Payment Processing Feature Flag
- **Environment Variable**: `NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS`
- **Default**: `false` (disabled by default for safety)
- **Purpose**: Controls whether users can give or receive tips through the payment system

**When disabled (false)**:
- Users cannot send tips with compliments
- Payment setup page shows "disabled" message
- All payment-related API endpoints return "disabled" errors
- Users can still send compliment messages without tips

**When enabled (true)**:
- Full payment functionality is available
- Users can set up Stripe Connect accounts
- Tipping works normally through the compliment system

**Setting in Production**:
```bash
# Via Vercel Dashboard Environment Variables
NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS=true

# Or via Vercel CLI
vercel env add NEXT_PUBLIC_FEATURE_ENABLEPAYMENTS
```

### Adding New Feature Flags
1. Add the flag to `FeatureFlags` interface in `/lib/feature-flags.ts`
2. Set default value in `DEFAULT_FLAGS`
3. Use `useFeatureFlag()` in React components
4. Use `isFeatureEnabled()` in API routes and server-side code

## Database Architecture

The application uses PostgreSQL with Prisma ORM. The schema includes:
- **Users** - User accounts with authentication data (email, hashed password, profile info)
- **Recipes** - Core recipe data with structured ingredients and multiple images support
- **RecipeImages** - Multiple images per recipe with primary image designation
- **IngredientEntries** - Structured ingredient data with amounts, units, and ingredient names
- **Favorites** - Many-to-many relationship between users and recipes (implemented)
- **Ratings** - User ratings for recipes (1-5 stars) - placeholder for future implementation

### Database Relationships
- **User → Recipes**: One-to-many (user can create multiple recipes)
- **Recipe → RecipeImages**: One-to-many (recipe can have multiple images with primary designation)
- **Recipe → IngredientEntries**: One-to-many (recipe has structured ingredient data)
- **User → Favorites**: One-to-many (user can have multiple favorites)
- **Recipe → Favorites**: One-to-many (recipe can be favorited by multiple users)
- **User ↔ Recipe**: Many-to-many through Favorites table

### PostgreSQL Features

- Native array support for tags (String[] type)
- Structured ingredient storage with separate IngredientEntry model
- Multiple images per recipe with RecipeImage model
- Advanced search capabilities with `hasSome`, `hasEvery`, and `contains` operators
- Case-insensitive text search with `mode: 'insensitive'`
- GIN indexes for optimized array and full-text search performance
- Better concurrent access and connection pooling

## Core Architecture

### API Layer (`app/api/`)
- REST API endpoints using Next.js App Router
- Centralized error handling and response formatting
- Prisma integration for PostgreSQL database operations
- Native array handling with PostgreSQL

### Client-Side Data Management
- **API Client** (`lib/api-client.ts`) - Centralized HTTP client with type safety
- **Custom Hooks** (`hooks/use-recipes.ts`) - React hooks for data fetching, loading states, pagination
- **Type Definitions** (`types/recipe.ts`) - TypeScript interfaces for all data structures

### Component Structure
- **UI Components** (`components/ui/`) - Reusable UI elements
- **Form Components** (`components/recipe-form.tsx`) - Recipe creation/editing
- **Error Boundaries** (`components/error-boundary.tsx`) - Error handling wrapper

## Key Implementation Details

### Recipe Data Flow
1. Frontend forms collect recipe data including multiple images
2. API routes validate and structure data (ingredients → IngredientEntry objects)
3. Prisma stores data in PostgreSQL with proper relationships
4. Images are stored as RecipeImage objects with primary designation
5. Custom hooks manage loading states and pagination

### Search Implementation
- Text search across title, description, ingredients, and tags
- Difficulty filtering (easy/medium/hard)
- Pagination with configurable page size
- Debounced search input (300ms delay)

### Multiple Images System
**Status: ✅ IMPLEMENTED**

Complete multiple images functionality with primary image designation:

#### Features
- **Multiple Image Upload** - Users can upload up to 5 images per recipe
- **Primary Image Designation** - One image can be marked as primary for recipe cards
- **Drag & Drop Reordering** - Images can be reordered with drag and drop
- **Deferred Upload Strategy** - Images only upload to B2 when recipe is saved
- **Image Gallery** - Recipe detail pages show all images in a responsive gallery
- **Image Modal** - Full-size image viewing with navigation

#### Implementation
```typescript
// Recipe with multiple images
const recipe = {
  title: "Recipe Title",
  images: [
    {
      id: "img_123",
      url: "https://...",
      isPrimary: true,
      displayOrder: 0,
      alt: "Recipe image",
      caption: "Optional caption"
    }
  ]
};

// Getting primary image for recipe cards
const primaryImage = recipe.images?.find(img => img.isPrimary) || recipe.images?.[0];
```

#### Key Files
- `/components/ui/multiple-image-upload.tsx` - Image upload component with drag & drop
- `/components/ui/recipe-image-gallery.tsx` - Recipe detail image gallery
- `/components/ui/recipe-card.tsx` - Uses primary image for recipe cards
- `/lib/image-client-utils.ts` - Image optimization and B2 URL handling

### Structured Ingredients System
**Status: ✅ IMPLEMENTED**

Ingredients are stored as structured data with amounts, units, and ingredient names:

#### Features
- **Structured Storage** - Each ingredient has amount, unit, and ingredient name
- **Flexible Amounts** - Supports fractional amounts, decimals, or no amount ("to taste")
- **Recipe Scaling** - Ingredients can be scaled up/down for different serving sizes
- **Search Integration** - Ingredients are searchable across the platform

#### Implementation
```typescript
// Structured ingredient data
const ingredient = {
  id: "ing_123",
  amount: 2.5,          // Optional numeric amount
  unit: "cups",         // Optional unit (cups, tbsp, etc.)
  ingredient: "flour",  // Required ingredient name
  recipeId: "recipe_123"
};

// Recipe scaling
const scaledIngredients = scaleIngredients(recipe.ingredients, 2.0); // 2x scale
```

#### Key Files
- `/lib/recipe-scaling.ts` - Recipe scaling utilities and fraction formatting
- `/components/ui/recipe-scale-slider.tsx` - Interactive scaling component
- `/components/ingredient-input.tsx` - Structured ingredient input form

### Legacy System Migration
**Status: ✅ COMPLETED (2025-01-27)**

The application has been fully migrated from legacy single-image and string-based ingredients to modern structured systems:

#### What Was Removed
- Legacy `image` field from Recipe model (removed from database schema)
- String-based ingredients array (migrated to structured IngredientEntry model)
- All fallback logic for legacy image handling in components
- Legacy image upload and management code

#### Migration Process
1. **Database Schema Update** - Added RecipeImage and IngredientEntry models
2. **Data Migration** - Migrated all existing legacy images to new RecipeImage system
3. **Code Cleanup** - Removed all legacy image references from codebase
4. **Production Deployment** - Safely applied changes to production database
5. **Legacy Column Removal** - Dropped legacy image column from production

#### Current State
- All recipes use RecipeImage model exclusively
- All ingredients use structured IngredientEntry model
- No legacy dependencies remain in codebase
- Clean, maintainable image and ingredient systems

## Authentication System
**Status: ✅ IMPLEMENTED**

The application now includes a complete authentication system:

### NextAuth.js Integration
- **Provider**: Credentials provider for email/password authentication
- **Session Strategy**: JWT-based sessions for scalability
- **Security**: Secure password hashing with bcrypt
- **Demo Users**: Pre-configured demo accounts for testing

### Authentication Flow
1. User registration creates new account with hashed password
2. Sign-in validates credentials and creates JWT session
3. Session persists across page loads and browser sessions
4. Protected routes check authentication status
5. API routes validate session for user-specific operations

### Demo Accounts
- **Sarah Chen** (sarah@example.com) - Password: demo
- **Mike Rodriguez** (mike@example.com) - Password: demo  
- **David Kim** (david@example.com) - Password: demo

### Key Files
- `/lib/auth.ts` - NextAuth configuration and utilities
- `/app/api/auth/[...nextauth]/route.ts` - NextAuth API route
- `/app/auth/signin/page.tsx` - Sign-in page with demo user shortcuts
- `/app/auth/signup/page.tsx` - User registration page
- `/components/providers/session-provider.tsx` - Session context provider

## Development Patterns

### Custom Hooks Usage
- Use `useRecipes()` for general recipe fetching
- Use `useRecipeSearch()` for search pages with filters
- Use `useFavorites()` for favorites management (implemented)

### Favorites System
**Status: ✅ IMPLEMENTED**

Complete favorites functionality with persistent storage:

#### Features
- **Toggle Favorites** - Add/remove recipes from favorites with heart icon
- **Favorites Page** - Dedicated page to view saved recipes (`/profile/favorites`)
- **Real-time Updates** - Instant UI feedback when favoriting/unfavoriting
- **Cross-page Consistency** - Favorites status syncs across home, search, and detail pages

#### Implementation
- **API Routes**: `/api/recipes/favorites` (POST) and `/api/users/favorites` (GET)
- **Custom Hook**: `useFavorites()` for centralized state management
- **Database**: Many-to-many relationship between Users and Recipes via Favorites table
- **UI Integration**: RecipeCard component with favorite toggle functionality

#### Key Files
- `/hooks/use-favorites.ts` - Custom hook for favorites state management
- `/app/api/recipes/favorites/route.ts` - API for toggling favorites
- `/app/api/users/favorites/route.ts` - API for fetching user's favorites
- `/app/profile/favorites/page.tsx` - Favorites page component
- `/components/ui/recipe-card.tsx` - Updated with favorites functionality

### Error Handling
- API routes return structured `{ success: boolean, data?: T, error?: string }` responses
- Custom hooks handle loading states and error management
- Error boundaries catch React component errors

### Database Operations
- Always use the singleton `prisma` instance from `lib/db.ts`
- Include related data with `include` option for complete recipe objects
- Use `_count` for social feature statistics

## File Structure Conventions

- `/app` - Next.js App Router pages and API routes
- `/components` - React components organized by feature
- `/lib` - Utility functions and shared services
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions
- `/prisma` - Database schema and migrations