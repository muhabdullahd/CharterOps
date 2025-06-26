#!/bin/bash

echo "🚀 CharterOps Vercel Deployment Script"
echo "======================================"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Vercel deployment"
fi

# Build the project to ensure it works
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix the issues before deploying."
    exit 1
fi

echo ""
echo "🌐 Starting Vercel deployment..."
echo "You will be prompted to:"
echo "1. Log in to Vercel (if not already logged in)"
echo "2. Link to an existing project or create a new one"
echo "3. Configure deployment settings"
echo ""

# Deploy to Vercel
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo "📝 Don't forget to:"
echo "   - Set up environment variables in Vercel dashboard"
echo "   - Configure your Supabase project"
echo "   - Update the database schema" 