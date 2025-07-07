# TasteBuddy 🍳

A modern recipe sharing platform built with Next.js 15, where food lovers can discover, create, and share amazing recipes with an intuitive interface and powerful search capabilities.

## Features

### 🔐 Authentication System
- **User Registration & Login** - Secure account creation with NextAuth.js
- **Demo Accounts** - Quick login with pre-configured demo users (Sarah, Mike, David)
- **Profile Management** - User profiles with personalized recipe collections
- **Session Management** - JWT-based authentication with secure session handling

### 📱 Recipe Management
- **Recipe Discovery** - Browse featured recipes on the homepage
- **Advanced Search** - Powerful search with filtering by difficulty, ingredients, tags, and more
- **Recipe Details** - Comprehensive recipe pages with ingredients, instructions, and metadata
- **Create & Share** - Add your own recipes with rich formatting options

### ⭐ Favorites System
- **Save Recipes** - Heart recipes to save them to your personal favorites
- **Favorites Page** - Dedicated page to view and manage your saved recipes
- **Persistent Storage** - Favorites are saved to your account and sync across devices
- **Real-time Updates** - Instant feedback when adding/removing favorites

### 🎨 User Experience
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Loading States** - Professional loading animations and skeleton screens
- **Error Handling** - Graceful error recovery with user-friendly messages
- **Intuitive Navigation** - Clean, consistent navigation throughout the app

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tastebuddy
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Demo Accounts

For quick testing, you can use these pre-configured demo accounts:

- **Sarah Chen** (sarah@example.com) - Password: demo
- **Mike Rodriguez** (mike@example.com) - Password: demo  
- **David Kim** (david@example.com) - Password: demo

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js v4
- **UI Components**: Lucide React icons
- **State Management**: React hooks with custom data fetching

## Project Structure

```
tastebuddy/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── profile/           # User profile pages
│   ├── recipes/           # Recipe pages
│   └── food-feed/         # Advanced search page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── providers/        # Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── prisma/               # Database schema and migrations
└── types/                # TypeScript definitions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:seed` - Seed database with sample data

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [NextAuth.js Documentation](https://next-auth.js.org/) - authentication for Next.js
- [Prisma Documentation](https://www.prisma.io/docs/) - modern database toolkit
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - utility-first CSS framework
