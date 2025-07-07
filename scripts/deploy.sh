#!/bin/bash

# TasteBuddy Deployment Script
# This script helps deploy TasteBuddy to production

echo "🍳 TasteBuddy Deployment Script"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the TasteBuddy project root directory"
    exit 1
fi

# Check if required tools are installed
command -v node >/dev/null 2>&1 || { echo "❌ Error: Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ Error: npm is required but not installed."; exit 1; }

echo "✅ Environment check passed"

# Build the project to ensure everything works
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful"

# Check for production environment variables
echo "🔍 Checking environment variables..."

if [ -f ".env.local" ]; then
    if grep -q "your-super-secret-key" .env.local; then
        echo "⚠️  Warning: Please update NEXTAUTH_SECRET in .env.local before deploying to production"
        echo "   Generate a secure secret with: openssl rand -base64 32"
    fi
    
    if grep -q "file:./dev.db" .env.local; then
        echo "⚠️  Warning: You're using SQLite. Consider switching to PostgreSQL for production"
        echo "   See DEPLOYMENT.md for database setup instructions"
    fi
fi

# Display next steps
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Choose your deployment platform:"
echo "   • Vercel (recommended): vercel"
echo "   • Railway: Connect your GitHub repo at railway.app"
echo "   • Netlify: Connect your GitHub repo at netlify.com"
echo ""
echo "2. Set up production database:"
echo "   • Vercel Postgres (if using Vercel)"
echo "   • Supabase (free PostgreSQL)"
echo "   • Railway Postgres (if using Railway)"
echo ""
echo "3. Configure environment variables:"
echo "   • DATABASE_URL (your production database connection string)"
echo "   • NEXTAUTH_URL (your deployed app URL)"
echo "   • NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
echo ""
echo "4. Run database migrations:"
echo "   • npx prisma db push (after setting DATABASE_URL)"
echo "   • npm run db:seed (optional, for sample data)"
echo ""
echo "📖 For detailed instructions, see DEPLOYMENT.md"
echo ""
echo "🎉 Happy deploying!"