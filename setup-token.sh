#!/bin/bash

# Secure GitHub Token Setup Script
echo "🔐 GitHub Token Setup for BVC Project"
echo "====================================="
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to update it? (y/n): " update_env
    if [ "$update_env" != "y" ]; then
        echo "Cancelled."
        exit 0
    fi
fi

# Prompt for token
echo "📝 Enter your GitHub Classic Personal Access Token:"
echo "   (Required scopes: write:packages, read:packages)"
read -s github_token

if [ -z "$github_token" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Create or update .env file
echo "GITHUB_TOKEN=$github_token" > .env
echo "✅ Token saved to .env file"

# Add .env to .gitignore if not already there
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
    echo ".env" >> .gitignore
    echo "✅ Added .env to .gitignore"
else
    echo "ℹ️  .env already in .gitignore"
fi

# Load the token for current session
export GITHUB_TOKEN=$github_token
echo "✅ Token loaded for current session"

echo ""
echo "🚀 Ready to publish! Run:"
echo "   npm publish"
echo ""
echo "💡 To load token in future sessions:"
echo "   source .env  # or"
echo "   export GITHUB_TOKEN=\$(grep GITHUB_TOKEN .env | cut -d '=' -f2)"
