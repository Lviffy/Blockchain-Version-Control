const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(process.cwd(), '.env');
        this.requiredVars = [
            'SEPOLIA_RPC_URL',
            'PRIVATE_KEY',
            'ETHERSCAN_API_KEY'
        ];
    }

    /**
     * Validate environment configuration
     */
    validate() {
        const issues = [];
        
        // Check if .env exists
        if (!fs.existsSync(this.configPath)) {
            issues.push({
                level: 'error',
                message: '.env file not found',
                fix: 'Copy .env.example to .env and configure'
            });
            return issues;
        }

        // Load environment variables
        require('dotenv').config();

        // Check required variables
        for (const varName of this.requiredVars) {
            if (!process.env[varName]) {
                issues.push({
                    level: 'error',
                    message: `Missing required variable: ${varName}`,
                    fix: `Add ${varName} to .env file`
                });
            }
        }

        // Validate private key format
        if (process.env.PRIVATE_KEY) {
            if (!/^[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY)) {
                issues.push({
                    level: 'warning',
                    message: 'Private key format invalid',
                    fix: 'Ensure private key is 64 hex characters'
                });
            }
        }

        // Check RPC URL format
        if (process.env.SEPOLIA_RPC_URL && !process.env.SEPOLIA_RPC_URL.startsWith('http')) {
            issues.push({
                level: 'warning',
                message: 'RPC URL should start with http/https',
                fix: 'Update SEPOLIA_RPC_URL format'
            });
        }

        // Check file permissions
        try {
            const stats = fs.statSync(this.configPath);
            const mode = (stats.mode & parseInt('777', 8)).toString(8);
            if (mode !== '600') {
                issues.push({
                    level: 'warning',
                    message: `.env file permissions: ${mode} (should be 600)`,
                    fix: 'Run: chmod 600 .env'
                });
            }
        } catch (error) {
            // Ignore permission check errors on Windows
        }

        return issues;
    }

    /**
     * Encrypt sensitive configuration
     */
    encryptConfig(password) {
        const sensitiveVars = ['PRIVATE_KEY', 'ETHERSCAN_API_KEY', 'GITHUB_TOKEN'];
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(password, 'salt', 32);
        
        const encrypted = {};
        
        for (const varName of sensitiveVars) {
            if (process.env[varName]) {
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipher(algorithm, key, iv);
                
                let encryptedValue = cipher.update(process.env[varName], 'utf8', 'hex');
                encryptedValue += cipher.final('hex');
                
                const authTag = cipher.getAuthTag();
                
                encrypted[varName] = {
                    iv: iv.toString('hex'),
                    authTag: authTag.toString('hex'),
                    data: encryptedValue
                };
            }
        }
        
        fs.writeFileSync('.env.encrypted', JSON.stringify(encrypted, null, 2));
        console.log('✅ Sensitive configuration encrypted to .env.encrypted');
    }

    /**
     * Generate secure configuration template
     */
    generateSecureTemplate() {
        const template = `# BVC Secure Configuration Template
# Generated on ${new Date().toISOString()}

# Network Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID

# Wallet Configuration (NEVER COMMIT THESE!)
PRIVATE_KEY=your_64_character_private_key_here
WALLET_PASSWORD=your_wallet_password_here

# API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key_here
INFURA_PROJECT_ID=your_infura_project_id_here
ALCHEMY_API_KEY=your_alchemy_api_key_here

# IPFS Configuration
IPFS_ENDPOINT=http://127.0.0.1:5001
IPFS_GATEWAY=https://ipfs.io/ipfs/

# Security Settings
MAX_GAS_PRICE=50000000000
TRANSACTION_TIMEOUT=300000
BACKUP_ENCRYPTION_KEY=${crypto.randomBytes(32).toString('hex')}

# Monitoring
DISCORD_WEBHOOK_URL=your_discord_webhook_for_alerts
EMAIL_ALERTS=your_email_for_alerts

# Development Settings
DEBUG_MODE=false
LOG_LEVEL=info
CACHE_DURATION=3600
`;

        fs.writeFileSync('.env.template', template);
        console.log('✅ Secure template generated: .env.template');
    }
}

module.exports = ConfigManager;

// CLI usage
if (require.main === module) {
    const manager = new ConfigManager();
    const issues = manager.validate();
    
    if (issues.length === 0) {
        console.log('✅ Configuration validation passed');
    } else {
        console.log('⚠️  Configuration issues found:');
        issues.forEach(issue => {
            const emoji = issue.level === 'error' ? '❌' : '⚠️';
            console.log(`${emoji} ${issue.message}`);
            console.log(`   💡 ${issue.fix}`);
        });
    }
}