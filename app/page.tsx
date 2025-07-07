'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star, Heart, Plus, Filter, Clock, Users, ChefHat } from 'lucide-react';

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string;
  cookTime: string;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  author: {
    id: string;
    name: string;
    email: string;
  };
  avgRating: number;
  totalRatings: number;
  createdAt: string;
}

// Sample data for development - replace with API calls
const sampleRecipes: Recipe[] = [
  {
    id: '1',
    title: "Classic Chocolate Chip Cookies",
    description: "These classic chocolate chip cookies are crispy on the outside and chewy on the inside, perfect for any occasion.",
    ingredients: [
      "2 cups all-purpose flour",
      "1 cup butter, softened",
      "3/4 cup brown sugar",
      "1/2 cup white sugar",
      "2 large eggs",
      "2 tsp vanilla extract",
      "1 tsp baking soda",
      "1 tsp salt",
      "2 cups chocolate chips"
    ],
    instructions: "Preheat oven to 375°F. In a large bowl, cream together butter and sugars until light and fluffy. Beat in eggs one at a time, then add vanilla. In a separate bowl, whisk together flour, baking soda, and salt. Gradually mix dry ingredients into wet ingredients. Stir in chocolate chips. Drop rounded tablespoons of dough onto ungreased baking sheets. Bake for 9-11 minutes or until golden brown.",
    cookTime: "25 mins",
    servings: 36,
    difficulty: "easy",
    tags: ["dessert", "cookies", "chocolate", "baking"],
    author: { id: '1', name: "Sarah Johnson", email: "sarah@example.com" },
    avgRating: 4.5,
    totalRatings: 128,
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: '2',
    title: "Creamy Chicken Alfredo",
    description: "Rich and creamy Alfredo sauce with tender chicken and perfectly cooked fettuccine.",
    ingredients: [
      "1 lb fettuccine pasta",
      "2 chicken breasts, sliced",
      "2 cups heavy cream",
      "1 cup grated Parmesan cheese",
      "4 cloves garlic, minced",
      "4 tbsp butter",
      "2 tbsp olive oil",
      "Salt and pepper to taste",
      "Fresh parsley for garnish"
    ],
    instructions: "Cook fettuccine according to package directions. Season chicken with salt and pepper, then cook in olive oil until golden and cooked through. Remove chicken and set aside. In the same pan, melt butter and sauté garlic for 1 minute. Add heavy cream and bring to a gentle simmer. Gradually whisk in Parmesan cheese until smooth. Return chicken to pan and toss with cooked pasta.",
    cookTime: "30 mins",
    servings: 4,
    difficulty: "medium",
    tags: ["dinner", "pasta", "chicken", "italian"],
    author: { id: '2', name: "Mike Chen", email: "mike@example.com" },
    avgRating: 4.2,
    totalRatings: 87,
    createdAt: "2024-01-14T15:20:00Z"
  },
  {
    id: '3',
    title: "Spicy Thai Green Curry",
    description: "Authentic Thai green curry with tender chicken and fresh vegetables in a rich coconut broth.",
    ingredients: [
      "400ml coconut milk",
      "2 tbsp green curry paste",
      "1 lb chicken thigh, cubed",
      "1 eggplant, cubed",
      "1 bell pepper, sliced",
      "1 cup green beans",
      "2 tbsp fish sauce",
      "1 tbsp brown sugar",
      "Thai basil leaves",
      "Jasmine rice for serving"
    ],
    instructions: "Heat a wok over medium-high heat. Add 2 tbsp of the thick coconut cream from the top of the can and fry curry paste for 2 minutes until fragrant. Add chicken and cook until no longer pink. Add remaining coconut milk, fish sauce, and brown sugar. Bring to a simmer, then add vegetables. Cook for 10-15 minutes until vegetables are tender. Stir in Thai basil leaves and serve over jasmine rice.",
    cookTime: "35 mins",
    servings: 4,
    difficulty: "medium",
    tags: ["asian", "curry", "spicy", "thai"],
    author: { id: '3', name: "David Liu", email: "david@example.com" },
    avgRating: 4.7,
    totalRatings: 156,
    createdAt: "2024-01-13T12:45:00Z"
  }
];

const StarRating = ({ rating, onRate, interactive = true }: { 
  rating: number; 
  onRate?: (rating: number) => void; 
  interactive?: boolean; 
}) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          onClick={() => interactive && onRate && onRate(star)}
        />
      ))}
    </div>
  );
};

const RecipeCard = ({ recipe }: { recipe: Recipe }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: API call to toggle favorite
  };

  const handleRating = (rating: number) => {
    setUserRating(rating);
    // TODO: API call to submit rating
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <Link href={`/recipes/${recipe.id}`}>
            <h3 className="text-xl font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
              {recipe.title}
            </h3>
          </Link>
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full ${isFavorite ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500' : ''}`} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-3">By {recipe.author.name}</p>
        <p className="text-gray-700 text-sm mb-4 line-clamp-2">{recipe.description}</p>
        
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {recipe.cookTime}
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {recipe.servings} servings
          </div>
          <div className="flex items-center">
            <ChefHat className="w-4 h-4 mr-1" />
            {recipe.difficulty}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {ingredient.split(',')[0].length > 15 
                  ? ingredient.split(',')[0].substring(0, 15) + '...' 
                  : ingredient.split(',')[0]}
              </span>
            ))}
            {recipe.ingredients.length > 3 && (
              <span className="text-gray-500 text-xs">+{recipe.ingredients.length - 3} more</span>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <StarRating rating={userRating} onRate={handleRating} />
            <span className="text-sm text-gray-600">
              {recipe.avgRating.toFixed(1)} ({recipe.totalRatings} reviews)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call
    // fetchRecipes();
    setRecipes(sampleRecipes);
    setLoading(false);
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/recipes');
      const data = await response.json();
      if (data.success) {
        setRecipes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm.toLowerCase())) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              TasteBuddy
            </Link>
            
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                Home
              </Link>
              <Link href="/profile/favorites" className="flex items-center text-gray-600 hover:text-gray-900">
                <Heart className="w-4 h-4 mr-1" />
                Favorites
              </Link>
              <Link href="/recipes/search" className="text-gray-600 hover:text-gray-900">
                Browse
              </Link>
              <Link href="/recipes/new" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center">
                <Plus className="w-4 h-4 mr-1" />
                Add Recipe
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
            Your Personal Recipe
            <span className="text-blue-600"> Companion</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover, cook, and share amazing recipes with TasteBuddy
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              href="/recipes/new"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
            >
              Share a Recipe
            </Link>
            <Link 
              href="/recipes/search"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50"
            >
              Explore Recipes
            </Link>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes, ingredients, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Featured Recipes */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Featured Recipes ({filteredRecipes.length})
          </h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading recipes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}

          {!loading && filteredRecipes.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No recipes found matching your search.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

