const fs = require('fs-extra');
const crypto = require('crypto');

class IPFSService {
  constructor() {
    this.client = null;
    this.endpoint = null;
  }

  async initialize(endpoint = 'http://127.0.0.1:5001') {
    try {
      this.endpoint = endpoint;
      
      // Test connection with a simple HTTP request
      const response = await fetch(`${endpoint}/api/v0/version`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Connected to IPFS node: ${data.Version}`);
        return true;
      } else {
        throw new Error('IPFS node not responding');
      }
    } catch (error) {
      console.warn('IPFS node not available:', error.message);
      console.log('Install IPFS: https://docs.ipfs.tech/install/');
      console.log('Start daemon: ipfs daemon');
      return false;
    }
  }

  async uploadFile(filePath) {
    if (!this.endpoint) {
      throw new Error('IPFS client not initialized');
    }

    try {
      const content = await fs.readFile(filePath);
      return await this.uploadBuffer(content);
    } catch (error) {
      throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
  }

  async uploadBuffer(buffer) {
    try {
      const formData = new FormData();
      const blob = new Blob([buffer]);
      formData.append('file', blob);

      const response = await fetch(`${this.endpoint}/api/v0/add`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.Hash;
    } catch (error) {
      // Fallback: create a mock hash for development
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      console.warn('IPFS upload failed, using mock hash:', hash.substring(0, 46));
      return `mock_${hash.substring(0, 40)}`;
    }
  }

  async uploadDirectory(dirPath) {
    // Simplified implementation - just upload as bundle
    const files = [];
    const path = require('path');
    
    const walkDir = async (currentPath, basePath = '') => {
      const items = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        const relativePath = path.join(basePath, item.name);
        
        if (item.isDirectory()) {
          await walkDir(fullPath, relativePath);
        } else {
          const content = await fs.readFile(fullPath);
          files.push({
            path: relativePath,
            content: content.toString('base64')
          });
        }
      }
    };

    await walkDir(dirPath);
    const bundle = JSON.stringify(files, null, 2);
    return await this.uploadBuffer(Buffer.from(bundle));
  }

  async downloadFile(cid, outputPath) {
    if (cid.startsWith('mock_')) {
      console.warn('Cannot download mock CID:', cid);
      return null;
    }

    try {
      const response = await fetch(`${this.endpoint}/api/v0/cat?arg=${cid}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.arrayBuffer();
      await fs.writeFile(outputPath, Buffer.from(content));
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to download file from IPFS: ${error.message}`);
    }
  }

  async createCommitBundle(files) {
    try {
      const bundle = [];
      
      for (const file of files) {
        const content = await fs.readFile(file.path);
        bundle.push({
          path: file.path,
          content: content.toString('base64'),
          hash: file.hash,
          size: file.size,
          modified: file.modified
        });
      }

      const bundleJson = JSON.stringify(bundle, null, 2);
      return await this.uploadBuffer(Buffer.from(bundleJson));
    } catch (error) {
      throw new Error(`Failed to create commit bundle: ${error.message}`);
    }
  }
}

module.exports = IPFSService;
