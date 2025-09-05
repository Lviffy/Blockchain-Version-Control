#!/bin/bash

# Script to view GitHub Packages in your repository
# Usage: ./view-packages.sh

echo "📦 BVC GitHub Packages Viewer"
echo "============================="
echo ""

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo "🔍 Checking packages in Lviffy/BVC repository..."
    echo ""
    
    # List packages using GitHub CLI
    gh api repos/Lviffy/BVC/packages --jq '.[] | {name: .name, package_type: .package_type, visibility: .visibility, created_at: .created_at}'
    
    echo ""
    echo "💡 To view packages in browser:"
    echo "   https://github.com/Lviffy/BVC/packages"
    
else
    echo "⚠️  GitHub CLI not found. Installing..."
    echo ""
    echo "To view your packages manually:"
    echo "1. Go to: https://github.com/Lviffy/BVC"
    echo "2. Click on the 'Packages' tab"
    echo "3. Or visit: https://github.com/Lviffy/BVC/packages"
    echo ""
    echo "To install GitHub CLI:"
    echo "  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "  echo \"deb [arch=\$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main\" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null"
    echo "  sudo apt update && sudo apt install gh"
fi

echo ""
echo "📋 Package URLs:"
echo "   Registry: https://npm.pkg.github.com/@lviffy/bvc-eth"
echo "   Install:  npm install @lviffy/bvc-eth --registry=https://npm.pkg.github.com"
