# Development Workflow

This document outlines the development workflow for TasteBuddy, including branching strategy, deployment process, and best practices.

## Branching Strategy

### Main Branch
- **`main`** - Production branch
- Automatically deploys to production via Vercel
- Should always be in a deployable state
- Protected branch (ideally with PR requirements)

### Feature Branches
- **`feature/*`** - New feature development
- **`bugfix/*`** - Bug fixes
- **`hotfix/*`** - Critical production fixes

## Development Workflow

### 1. Starting New Work

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Push branch to remote (sets up tracking)
git push -u origin feature/your-feature-name
```

### 2. Development Process

```bash
# Make your changes and commit regularly
git add .
git commit -m "Add feature description

Detailed explanation of changes made.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push changes to feature branch
git push origin feature/your-feature-name
```

### 3. Testing and Validation

Before merging to main:
- ✅ Test all functionality locally
- ✅ Run `npm run build` to ensure clean build
- ✅ Run `npm run lint` to check code quality
- ✅ Test in development environment
- ✅ Verify no breaking changes

### 4. Merging to Production

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge feature branch
git merge feature/your-feature-name

# Push to main (triggers production deployment)
git push origin main

# Clean up feature branch (optional)
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## Environment Setup

### Local Development
- **Database**: Local Neon PostgreSQL instance
- **URL**: `http://localhost:3000`
- **Environment**: `.env.local` with development settings

### Production
- **Database**: Production Neon PostgreSQL instance
- **URL**: Your Vercel production URL
- **Environment**: Vercel environment variables

## Best Practices

### Commit Messages
- Use descriptive commit messages
- Include Claude Code attribution when using AI assistance
- Reference issue numbers when applicable

### Branch Naming
- `feature/recipe-editing` - New features
- `bugfix/search-error` - Bug fixes
- `hotfix/security-patch` - Critical fixes

### Code Quality
- Always run linting before committing
- Test thoroughly in development
- Keep commits atomic and focused
- Document new features and APIs

## Deployment

### Automatic Deployment
- Pushing to `main` automatically triggers Vercel deployment
- Deployment status visible in GitHub and Vercel dashboard
- Rollback available through Vercel dashboard if needed

### Manual Deployment (if needed)
```bash
# Only if automatic deployment fails
vercel --prod
```

## Current Feature Branch

You are currently working on: `feature/recipe-editing`

### Next Steps:
1. Implement recipe editing functionality
2. Test thoroughly in development
3. Commit changes with descriptive messages
4. Push to feature branch regularly
5. Merge to main when ready for production