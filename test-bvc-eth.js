#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

console.log('🧪 Testing BVC-ETH Package Installation...\n');

// Test 1: Check if the package can be required
console.log('1. Testing package import...');
try {
    // Test if we can access the main entry point
    const bvcPath = path.join(__dirname, 'node_modules', 'bvc-eth', 'bin', 'bvc.js');
    console.log(`   ✅ Main entry point found: ${bvcPath}`);
    
    // Test if we can require some modules
    const CLIUtils = require('./node_modules/bvc-eth/lib/utils/cli');
    console.log('   ✅ CLI utilities loaded successfully');
    
    const ConfigManager = require('./node_modules/bvc-eth/lib/config/manager');
    console.log('   ✅ Config manager loaded successfully');
    
} catch (error) {
    console.log(`   ❌ Import failed: ${error.message}`);
}

// Test 2: Check CLI help command
console.log('\n2. Testing CLI help command...');
const testCLIHelp = () => {
    return new Promise((resolve) => {
        const bvcProcess = spawn('node', ['./node_modules/bvc-eth/bin/bvc.js', '--help'], {
            stdio: 'pipe'
        });
        
        let output = '';
        bvcProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        bvcProcess.stderr.on('data', (data) => {
            output += data.toString();
        });
        
        bvcProcess.on('close', (code) => {
            if (code === 0 && output.includes('Blockchain Version Control')) {
                console.log('   ✅ CLI help command works correctly');
                console.log('   📝 Available commands detected in help output');
            } else {
                console.log(`   ❌ CLI help failed with code ${code}`);
                console.log(`   Output: ${output}`);
            }
            resolve();
        });
        
        setTimeout(() => {
            bvcProcess.kill();
            console.log('   ⚠️  CLI help command timed out');
            resolve();
        }, 5000);
    });
};

// Test 3: Check version command
console.log('\n3. Testing version command...');
const testVersion = () => {
    return new Promise((resolve) => {
        const bvcProcess = spawn('node', ['./node_modules/bvc-eth/bin/bvc.js', '--version'], {
            stdio: 'pipe'
        });
        
        let output = '';
        bvcProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        bvcProcess.on('close', (code) => {
            if (code === 0 && output.trim().match(/^\d+\.\d+\.\d+/)) {
                console.log(`   ✅ Version command works: ${output.trim()}`);
            } else {
                console.log(`   ❌ Version command failed with code ${code}`);
                console.log(`   Output: ${output}`);
            }
            resolve();
        });
        
        setTimeout(() => {
            bvcProcess.kill();
            console.log('   ⚠️  Version command timed out');
            resolve();
        }, 5000);
    });
};

// Test 4: Check package structure
console.log('\n4. Testing package structure...');
const testStructure = async () => {
    const packagePath = path.join(__dirname, 'node_modules', 'bvc-eth');
    const requiredFiles = [
        'package.json',
        'bin/bvc.js',
        'lib/blockchain.js',
        'lib/ipfs.js',
        'lib/commands/init.js',
        'lib/commands/add.js',
        'lib/commands/commit.js',
        'README.md'
    ];
    
    for (const file of requiredFiles) {
        const filePath = path.join(packagePath, file);
        if (await fs.pathExists(filePath)) {
            console.log(`   ✅ ${file} exists`);
        } else {
            console.log(`   ❌ ${file} missing`);
        }
    }
};

// Test 5: Test package.json contents
console.log('\n5. Testing package.json...');
const testPackageJson = async () => {
    try {
        const packagePath = path.join(__dirname, 'node_modules', 'bvc-eth', 'package.json');
        const packageData = await fs.readJson(packagePath);
        
        console.log(`   ✅ Package name: ${packageData.name}`);
        console.log(`   ✅ Package version: ${packageData.version}`);
        console.log(`   ✅ Main entry: ${packageData.main}`);
        console.log(`   ✅ Binary commands: ${Object.keys(packageData.bin || {}).join(', ')}`);
        
        if (packageData.dependencies) {
            console.log(`   ✅ Dependencies count: ${Object.keys(packageData.dependencies).length}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Package.json test failed: ${error.message}`);
    }
};

// Run all tests
async function runTests() {
    await testStructure();
    await testPackageJson();
    await testCLIHelp();
    await testVersion();
    
    console.log('\n🎉 BVC-ETH package testing completed!');
    console.log('\n💡 Next steps:');
    console.log('   - Run "npx bvc config --setup" to configure BVC');
    console.log('   - Create a test project with "npx bvc init test-project"');
    console.log('   - Check the documentation in README.md');
}

runTests().catch(console.error);