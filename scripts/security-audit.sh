#!/bin/bash

# BVC Environment Validation Script
# Checks for security issues and configuration problems

echo "🔍 BVC Security & Configuration Audit"
echo "====================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found"
    echo "📝 Copy .env.example to .env and configure"
    exit 1
fi

# Check .gitignore
if grep -q "^\.env$" .gitignore; then
    echo "✅ .env properly ignored in git"
else
    echo "⚠️  .env should be in .gitignore"
fi

# Check for placeholder values
echo "🔍 Checking for placeholder values..."
if grep -q "YOUR_INFURA_PROJECT_ID\|your_private_key_here\|your_etherscan_api_key_here" .env; then
    echo "⚠️  Found placeholder values in .env - please update"
fi

# Check private key format
PRIVATE_KEY=$(grep "^PRIVATE_KEY=" .env | cut -d'=' -f2)
if [[ ${#PRIVATE_KEY} -ne 64 ]]; then
    echo "⚠️  Private key should be 64 characters (32 bytes hex)"
fi

# Check file permissions
PERMS=$(stat -c "%a" .env)
if [ "$PERMS" != "600" ]; then
    echo "⚠️  .env file permissions: $PERMS (should be 600)"
    echo "🔧 Fix with: chmod 600 .env"
fi

# Check for common security issues
echo "🔐 Security checks..."
if grep -q "private.*key" .env; then
    echo "✅ Private key field found"
fi

# Test network connectivity
echo "🌐 Testing network connectivity..."
if curl -s --max-time 5 https://sepolia.infura.io > /dev/null; then
    echo "✅ Sepolia network reachable"
else
    echo "❌ Cannot reach Sepolia network"
fi

# Test IPFS
if curl -s --max-time 5 http://127.0.0.1:5001/api/v0/version > /dev/null; then
    echo "✅ IPFS node available"
else
    echo "⚠️  IPFS node not running (start with: ipfs daemon)"
fi

echo ""
echo "💡 Security Recommendations:"
echo "  • Use hardware wallet for mainnet"
echo "  • Rotate API keys regularly"
echo "  • Enable 2FA on all accounts"
echo "  • Use encrypted storage for keys"
echo "  • Monitor wallet activity"