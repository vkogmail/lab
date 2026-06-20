#!/bin/bash

echo "🚀 Starting BackgroundShade application..."

# First, make sure the token CSS file exists
echo "📝 Generating initial tokens..."
npm run tokens

# Then start the application with both watchers
echo "🔄 Starting server and watchers..."
npm run dev:all 