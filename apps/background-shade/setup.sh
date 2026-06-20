#!/bin/bash

# BackgroundShade Setup Script
echo "📚 Setting up BackgroundShade..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create necessary directories if they don't exist
echo "🗂️ Creating necessary directories..."
mkdir -p public/tokens/Foundation
mkdir -p public/tokens/Components
mkdir -p public/tokens/Output

# Build the tokens
echo "🎨 Building initial tokens..."
node_modules/.bin/style-dictionary build

# Start the development server
echo "✅ Setup complete! Starting the development server..."
echo "👉 The app will be available at http://localhost:3000"
npm run dev 