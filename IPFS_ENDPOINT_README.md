# IPFS Endpoint Documentation for BVC

## Overview

The Blockchain Version Control (BVC) system uses IPFS (InterPlanetary File System) as its distributed storage layer for file content and commit bundles. This document explains how IPFS endpoints are configured, managed, and used within the BVC ecosystem.

## Table of Contents

- [IPFS Architecture](#ipfs-architecture)
- [Endpoint Configuration](#endpoint-configuration)
- [IPFSService Class](#ipfsservice-class)
- [API Methods](#api-methods)
- [Setup Instructions](#setup-instructions)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## IPFS Architecture

BVC leverages IPFS for:
- **File Storage**: Storing actual file content as content-addressed objects
- **Commit Bundles**: Packaging multiple files into JSON bundles for version control
- **Distributed Access**: Enabling decentralized file retrieval across network nodes
- **Content Integrity**: Using cryptographic hashes to ensure file integrity

### Storage Flow
```
Local Files → Bundle Creation → IPFS Upload → CID Generation → Blockchain Reference
```

## Endpoint Configuration

### Default Endpoint
```javascript
const defaultEndpoint = 'http://127.0.0.1:5001'
```

### Supported Endpoints
- **Local IPFS Node**: `http://127.0.0.1:5001` (default)
- **Remote IPFS Gateway**: `https://ipfs.io/api/v0`
- **Custom IPFS API**: Any compatible IPFS HTTP API endpoint

### Environment Configuration
You can configure the IPFS endpoint through:

1. **Environment Variable**:
   ```bash
   export BVC_IPFS_ENDPOINT="http://your-ipfs-node:5001"
   ```

2. **Configuration File** (`.bvc/config.json`):
   ```json
   {
     "ipfs": {
       "endpoint": "http://127.0.0.1:5001",
       "timeout": 30000,
       "retries": 3
     }
   }
   ```

## IPFSService Class

The `IPFSService` class (`lib/ipfs.js`) provides the core IPFS functionality:

### Initialization
```javascript
const ipfsService = new IPFSService();
await ipfsService.initialize('http://127.0.0.1:5001');
```

### Connection Testing
The service automatically tests the connection by calling the IPFS version endpoint:
```
POST /api/v0/version
```

## API Methods

### Core Upload Methods

#### `uploadFile(filePath, content)`
Uploads a single file to IPFS with multiple fallback strategies:

1. **Primary**: HTTP API using FormData
2. **Fallback**: CLI method using temporary files
3. **Final Fallback**: Mock hash generation for development

```javascript
const cid = await ipfsService.uploadFile('/path/to/file', fileContent);
// Returns: "QmXxXxXxXx..." or "mock_abcd1234"
```

#### `uploadBuffer(buffer)`
Uploads raw buffer data to IPFS:

```javascript
const buffer = Buffer.from('Hello, IPFS!');
const cid = await ipfsService.uploadBuffer(buffer);
```

#### `uploadDirectory(dirPath)`
Recursively uploads an entire directory as a JSON bundle:

```javascript
const cid = await ipfsService.uploadDirectory('./my-project');
```

### Download Methods

#### `downloadFile(cid, outputPath)`
Downloads a file from IPFS using its Content Identifier (CID):

```javascript
await ipfsService.downloadFile('QmXxXxXxXx...', './downloaded-file.txt');
```

#### `downloadCommitBundle(cid, outputDir)`
Downloads and extracts a commit bundle:

```javascript
const files = await ipfsService.downloadCommitBundle('QmYyYyYyYy...', './extracted/');
```

### Bundle Management

#### `createCommitBundle(files)`
Creates a versioned bundle of files for commit storage:

```javascript
const files = [
  { path: 'src/index.js', hash: 'abc123', size: 1024, modified: Date.now() },
  { path: 'package.json', hash: 'def456', size: 512, modified: Date.now() }
];
const bundleCid = await ipfsService.createCommitBundle(files);
```

Bundle structure:
```json
[
  {
    "path": "src/index.js",
    "content": "base64-encoded-content",
    "hash": "sha256-hash",
    "size": 1024,
    "modified": 1693958400000
  }
]
```

### Utility Methods

#### `verifyFileIntegrity(filePath, expectedHash)`
Verifies file integrity using SHA-256 checksums:

```javascript
const isValid = await ipfsService.verifyFileIntegrity('./file.txt', 'expected-hash');
```

## Setup Instructions

### 1. Install IPFS (Kubo)

#### Using Package Manager
```bash
# macOS
brew install ipfs

# Ubuntu/Debian
sudo apt update
sudo apt install ipfs

# Arch Linux
sudo pacman -S kubo
```

#### Manual Installation
```bash
# Download and extract
wget https://dist.ipfs.tech/kubo/v0.22.0/kubo_v0.22.0_linux-amd64.tar.gz
tar -xzf kubo_v0.22.0_linux-amd64.tar.gz
cd kubo

# Install
sudo ./install.sh
```

### 2. Initialize IPFS Node
```bash
ipfs init
```

### 3. Start IPFS Daemon
```bash
ipfs daemon
```

The daemon will start on `http://127.0.0.1:5001` by default.

### 4. Verify Installation
```bash
# Check version
ipfs version

# Test API
curl -X POST http://127.0.0.1:5001/api/v0/version
```

## Troubleshooting

### Common Issues

#### 1. IPFS Node Not Available
**Error**: `IPFS node not available: ECONNREFUSED`

**Solutions**:
- Start IPFS daemon: `ipfs daemon`
- Check if port 5001 is available: `netstat -tulpn | grep 5001`
- Verify firewall settings

#### 2. API Access Denied
**Error**: `403 Forbidden` or `API access denied`

**Solution**: Configure IPFS API access:
```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["GET", "POST"]'
```

#### 3. Upload Timeout
**Error**: Upload fails with timeout

**Solutions**:
- Increase timeout in configuration
- Check network connectivity
- Try smaller file sizes first

#### 4. Mock Hash Generation
**Warning**: `Using mock hash for development`

This occurs when IPFS is unavailable. The system generates deterministic mock hashes for development:
```
mock_<8-char-sha256-prefix>
```

### Diagnostic Commands

```bash
# Check IPFS status
ipfs id

# View IPFS configuration
ipfs config show

# Check connected peers
ipfs swarm peers

# Test file operations
echo "test" | ipfs add
ipfs cat <returned-hash>
```

## Advanced Configuration

### Custom API Configuration

#### CORS Settings
```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["X-Requested-With", "Range"]'
```

#### Gateway Configuration
```bash
ipfs config Addresses.Gateway /ip4/127.0.0.1/tcp/8080
ipfs config --json Gateway.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
```

#### Performance Tuning
```bash
# Increase connection limits
ipfs config --json Swarm.ConnMgr.HighWater 900
ipfs config --json Swarm.ConnMgr.LowWater 600

# Optimize datastore
ipfs config --json Datastore.BloomFilterSize 1048576
```

### BVC-Specific Configuration

#### Custom Endpoint in BVC
```javascript
// In your BVC configuration
const bvcConfig = {
  ipfs: {
    endpoint: 'http://your-custom-ipfs:5001',
    timeout: 60000,
    retries: 5,
    fallbackToCLI: true,
    mockInDevelopment: true
  }
};
```

#### Network-Specific Settings
```json
{
  "networks": {
    "development": {
      "ipfs": { "endpoint": "http://127.0.0.1:5001" }
    },
    "staging": {
      "ipfs": { "endpoint": "https://staging-ipfs.yourorg.com" }
    },
    "production": {
      "ipfs": { "endpoint": "https://ipfs.yourorg.com" }
    }
  }
}
```

## Integration with BVC Commands

### File Operations
```bash
# Add files to BVC (uploads to IPFS)
bvc add src/

# Commit changes (creates IPFS bundle)
bvc commit -m "Update codebase"

# Clone repository (downloads from IPFS)
bvc clone <repo-id>

# Pull changes (syncs from IPFS)
bvc pull
```

### Status and Logging
```bash
# View IPFS-related status
bvc status --verbose

# Check IPFS connectivity
bvc config ipfs.status
```

## Security Considerations

1. **Private Networks**: Use private IPFS networks for sensitive code
2. **Access Control**: Configure API access restrictions
3. **Content Validation**: Always verify downloaded content integrity
4. **Pinning Strategy**: Pin important content to prevent garbage collection

## Best Practices

1. **Regular Pinning**: Pin critical repository data
2. **Backup Strategy**: Maintain multiple IPFS nodes
3. **Monitoring**: Monitor IPFS node health and connectivity
4. **Performance**: Use local IPFS nodes for better performance
5. **Updates**: Keep IPFS (Kubo) updated to latest stable version

## Resources

- [IPFS Documentation](https://docs.ipfs.tech/)
- [Kubo GitHub Repository](https://github.com/ipfs/kubo)
- [IPFS HTTP API Reference](https://docs.ipfs.tech/reference/kubo/rpc/)
- [BVC Project Repository](https://github.com/Lviffy/BVC)

---

*This documentation is part of the Blockchain Version Control (BVC) project. For questions or contributions, please refer to the main project repository.*
