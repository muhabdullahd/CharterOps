#!/bin/bash

echo "🚀 CharterOps Setup Script"
echo "=========================="

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Supabase Configuration
# Replace these with your actual Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Instructions:
# 1. Go to https://supabase.com and create a new project
# 2. Go to Settings > API in your Supabase dashboard
# 3. Copy the Project URL and anon public key
# 4. Replace the values above with your actual credentials
EOF
    echo "✅ .env.local created with placeholder values"
    echo "⚠️  Please update .env.local with your actual Supabase credentials"
else
    echo "✅ .env.local already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run the SQL schema in supabase-schema.sql on your Supabase project"
echo "3. Start the development server: npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "📚 For more information, see README.md" 