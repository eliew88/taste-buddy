# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TasteBuddy is a Next.js 15 recipe sharing platform built with TypeScript, Tailwind CSS, and Prisma ORM. The application uses SQLite for development and follows a typical Next.js App Router structure with API routes.

## Development Commands

- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check code quality
- `npm run db:seed` - Seed the database with sample data using prisma/seed.ts

## Database Architecture

The application uses SQLite with Prisma ORM. The schema includes:
- **Users** - User accounts with authentication data (email, hashed password, profile info)
- **Recipes** - Core recipe data with ingredients/tags stored as JSON strings
- **Favorites** - Many-to-many relationship between users and recipes (implemented)
- **Ratings** - User ratings for recipes (1-5 stars) - placeholder for future implementation

### Database Relationships
- **User → Favorites**: One-to-many (user can have multiple favorites)
- **Recipe → Favorites**: One-to-many (recipe can be favorited by multiple users)
- **User ↔ Recipe**: Many-to-many through Favorites table

### SQLite-Specific Considerations

- Arrays (ingredients, tags) are stored as JSON strings due to SQLite limitations
- JSON parsing/stringify is handled in API routes and helper functions
- Search uses `contains` queries instead of full-text search
- Use `JSON.parse()` when reading and `JSON.stringify()` when writing array fields

## Core Architecture

### API Layer (`app/api/`)
- REST API endpoints using Next.js App Router
- Centralized error handling and response formatting
- Prisma integration for database operations
- JSON transformation for SQLite compatibility

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
1. Frontend forms collect recipe data
2. API routes validate and transform data (arrays → JSON strings)
3. Prisma stores data in SQLite
4. API routes transform back (JSON strings → arrays) for client consumption
5. Custom hooks manage loading states and pagination

### Search Implementation
- Text search across title, description, ingredients, and tags
- Difficulty filtering (easy/medium/hard)
- Pagination with configurable page size
- Debounced search input (300ms delay)

### JSON Field Handling
Always use these patterns when working with ingredients/tags:
```typescript
// Storing in database
const recipeData = {
  ingredients: JSON.stringify(ingredientsArray),
  tags: JSON.stringify(tagsArray)
};

// Reading from database
const recipe = {
  ...dbRecipe,
  ingredients: JSON.parse(dbRecipe.ingredients),
  tags: JSON.parse(dbRecipe.tags)
};
```

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