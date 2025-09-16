const fs = require('fs-extra');
const path = require('path');

class IPFSBackupManager {
    constructor() {
        this.backupNodes = [
            'http://127.0.0.1:5001',
            'https://ipfs.infura.io:5001',
            'https://ipfs.io',
        ];
        this.backupDirectory = path.join(process.cwd(), '.bvc-backups');
        this.maxBackups = 10;
    }

    /**
     * Initialize backup system
     */
    async initialize() {
        await fs.ensureDir(this.backupDirectory);
        console.log(`✅ Backup system initialized: ${this.backupDirectory}`);
    }

    /**
     * Create local backup of repository state
     */
    async createLocalBackup(repoName, data) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(
            this.backupDirectory, 
            `${repoName}-${timestamp}.json`
        );

        const backupData = {
            timestamp: new Date().toISOString(),
            repository: repoName,
            data: data,
            version: '1.0'
        };

        await fs.writeJson(backupFile, backupData, { spaces: 2 });
        console.log(`📁 Local backup created: ${backupFile}`);

        // Clean up old backups
        await this.cleanupOldBackups(repoName);
    }

    /**
     * Pin content to multiple IPFS nodes
     */
    async pinToMultipleNodes(cid) {
        const results = [];
        
        for (const node of this.backupNodes) {
            try {
                const response = await fetch(`${node}/api/v0/pin/add?arg=${cid}`, {
                    method: 'POST',
                    timeout: 10000
                });
                
                if (response.ok) {
                    results.push({ node, status: 'pinned', cid });
                    console.log(`📌 Pinned ${cid} to ${node}`);
                } else {
                    results.push({ node, status: 'failed', error: response.statusText });
                }
            } catch (error) {
                results.push({ node, status: 'error', error: error.message });
                console.warn(`⚠️  Failed to pin to ${node}: ${error.message}`);
            }
        }

        return results;
    }

    /**
     * Retrieve content from backup nodes
     */
    async retrieveFromBackup(cid) {
        for (const node of this.backupNodes) {
            try {
                const response = await fetch(`${node}/api/v0/cat?arg=${cid}`, {
                    method: 'POST',
                    timeout: 10000
                });
                
                if (response.ok) {
                    const data = await response.text();
                    console.log(`✅ Retrieved ${cid} from ${node}`);
                    return data;
                }
            } catch (error) {
                console.warn(`⚠️  Failed to retrieve from ${node}: ${error.message}`);
            }
        }
        
        throw new Error(`Failed to retrieve ${cid} from any backup node`);
    }

    /**
     * Clean up old backups
     */
    async cleanupOldBackups(repoName) {
        try {
            const files = await fs.readdir(this.backupDirectory);
            const repoBackups = files
                .filter(file => file.startsWith(`${repoName}-`) && file.endsWith('.json'))
                .map(file => ({
                    name: file,
                    path: path.join(this.backupDirectory, file),
                    stat: fs.statSync(path.join(this.backupDirectory, file))
                }))
                .sort((a, b) => b.stat.mtime - a.stat.mtime);

            // Keep only the most recent backups
            if (repoBackups.length > this.maxBackups) {
                const toDelete = repoBackups.slice(this.maxBackups);
                for (const backup of toDelete) {
                    await fs.remove(backup.path);
                    console.log(`🗑️  Removed old backup: ${backup.name}`);
                }
            }
        } catch (error) {
            console.warn(`⚠️  Backup cleanup failed: ${error.message}`);
        }
    }

    /**
     * List available backups
     */
    async listBackups(repoName) {
        try {
            const files = await fs.readdir(this.backupDirectory);
            const repoBackups = files
                .filter(file => file.startsWith(`${repoName}-`) && file.endsWith('.json'))
                .map(file => {
                    const stat = fs.statSync(path.join(this.backupDirectory, file));
                    return {
                        name: file,
                        created: stat.birthtime,
                        size: stat.size
                    };
                })
                .sort((a, b) => b.created - a.created);

            return repoBackups;
        } catch (error) {
            console.warn(`⚠️  Failed to list backups: ${error.message}`);
            return [];
        }
    }

    /**
     * Restore from backup
     */
    async restoreFromBackup(repoName, backupName) {
        const backupFile = path.join(this.backupDirectory, backupName);
        
        if (!await fs.pathExists(backupFile)) {
            throw new Error(`Backup file not found: ${backupName}`);
        }

        const backupData = await fs.readJson(backupFile);
        console.log(`🔄 Restoring ${repoName} from backup: ${backupName}`);
        
        return backupData.data;
    }
}

module.exports = IPFSBackupManager;