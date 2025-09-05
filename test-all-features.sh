#!/bin/bash

# BVC Full Feature Test Script
# Tests all implemented functionality

echo "🔗 BVC Full Feature Test Suite"
echo "============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo ""
    info "Test $TESTS_RUN: $test_name"
    echo "Command: $test_command"
    
    if eval "$test_command"; then
        success "Test passed: $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        error "Test failed: $test_name"
        return 1
    fi
}

# Start testing
echo ""
info "Starting BVC feature tests..."

# Test 1: Help command
run_test "Help Command" "node bin/bvc.js --help > /dev/null"

# Test 2: Version command
run_test "Version Command" "node bin/bvc.js --version > /dev/null"

# Test 3: Individual command help
run_test "Init Command Help" "node bin/bvc.js init --help > /dev/null"
run_test "Push Command Help" "node bin/bvc.js push --help > /dev/null"
run_test "Pull Command Help" "node bin/bvc.js pull --help > /dev/null"
run_test "Clone Command Help" "node bin/bvc.js clone --help > /dev/null"
run_test "Checkpoint Command Help" "node bin/bvc.js checkpoint --help > /dev/null"
run_test "List Command Help" "node bin/bvc.js list --help > /dev/null"

# Test 4: Smart contract compilation
run_test "Smart Contract Compilation" "npx hardhat compile > /dev/null"

# Test 5: Smart contract tests
run_test "Smart Contract Tests" "npm test > /dev/null"

# Test 6: Package.json validation
run_test "Package.json Syntax" "node -e 'JSON.parse(require(\"fs\").readFileSync(\"package.json\"))'"

# Test 7: JavaScript syntax validation
run_test "Main CLI Syntax" "node -c bin/bvc.js"
run_test "Blockchain Service Syntax" "node -c lib/blockchain.js"
run_test "IPFS Service Syntax" "node -c lib/ipfs.js"
run_test "Push Command Syntax" "node -c lib/commands/push.js"
run_test "Pull Command Syntax" "node -c lib/commands/pull.js"
run_test "Clone Command Syntax" "node -c lib/commands/clone.js"
run_test "Checkpoint Command Syntax" "node -c lib/commands/checkpoint.js"
run_test "List Command Syntax" "node -c lib/commands/list.js"

# Test 8: Required dependencies
run_test "Dependencies Check" "npm ls --depth=0 > /dev/null"

# Test 9: Documentation files exist
run_test "README exists" "test -f README.md"
run_test "PROGRESS exists" "test -f PROGRESS.md"
run_test "Command Guide exists" "test -f BVC_COMMAND_GUIDE.md"

# Test 10: Contract artifacts exist
run_test "Contract Source exists" "test -f contracts/BVC.sol"

# Summary
echo ""
echo "============================"
echo "🎯 Test Results Summary"
echo "============================"
echo "Tests Run: $TESTS_RUN"
echo "Tests Passed: $TESTS_PASSED"
echo "Tests Failed: $((TESTS_RUN - TESTS_PASSED))"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    success "All tests passed! 🎉"
    echo ""
    echo "🚀 BVC is ready for use!"
    echo ""
    echo "Quick start:"
    echo "1. npm run deploy-local  # Deploy to local blockchain"
    echo "2. node bin/bvc.js config --setup  # Configure BVC"
    echo "3. node bin/bvc.js init my-project  # Create repository"
    echo "4. echo 'console.log(\"Hello BVC!\");' > index.js"
    echo "5. node bin/bvc.js add index.js  # Stage file"
    echo "6. node bin/bvc.js commit -m \"Initial commit\"  # Commit"
    echo "7. node bin/bvc.js push  # Push to blockchain"
    echo "8. node bin/bvc.js log  # View history"
    echo ""
    exit 0
else
    error "Some tests failed!"
    echo ""
    echo "Please check the failed tests above and fix any issues."
    exit 1
fi
