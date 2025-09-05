# 📌 Blockchain Version Control (BVC)

## 🚀 Overview
**Blockchain Version Control (BVC)** is a decentralized version control system inspired by Git, but powered by **blockchain** and **IPFS**.  

It ensures **immutability, transparency, and true ownership** of code history by recording commit metadata on-chain while storing actual file contents/diffs on IPFS.  

BVC combines the trustless nature of blockchains with the efficiency of content-addressed storage.

---

## 🛠️ Core Features

### 🔹 Repository Management
- **`init`** → Create a new repository (on-chain + local `.bvc/` folder).  
- **`clone <repoId>`** → Clone an existing repository from blockchain/IPFS.  
- **`config`** → Manage user identity (wallet address, keypair).  

---

### 🔹 File Operations
- **`add <file>`** → Stage files for commit.  
- **`commit -m "message"`** → Create a new commit:
  - Hash staged files (SHA256).  
  - Upload files/diffs to IPFS.  
  - Record commit metadata on blockchain.  
- **`status`** → Show staged/untracked files.  

---

### 🔹 Synchronization
- **`push`** → Push staged commits to blockchain.  
- **`pull`** → Fetch latest commits from blockchain/IPFS.  
- **`log`** → View commit history (on-chain data).  

---

### 🔹 Collaboration
- **Forks** → Any repo can be forked by another wallet.  
- **Merges** → Repository owner can merge commits or enable DAO-style governance.  
- **Access Control** → Repository ownership & permissions tied to wallet addresses.  

---

### 🔹 Checkpoint Commits
To reduce gas costs, **not every commit is published on-chain individually**.  

Instead, developers can use:  

- **`checkpoint`** → Bundle multiple local commits and push them as a single on-chain checkpoint.  

**How it works:**
1. Collects all commits since the last checkpoint.  
2. Packages them into a **Merkle tree or packfile**.  
3. Uploads the bundle to IPFS → returns a `bundleCID`.  
4. Posts a **single transaction** anchoring:
   - `fromCommitHash` → `toCommitHash`  
   - `bundleCID`  
   - `merkleRoot`  

This ensures:  
- **Gas efficiency** (1 tx per batch).  
- **Integrity** (Merkle root proofs).  
- **Flexibility** (teams choose when to anchor history).  

---

## 🔹 Checkpoint Workflow (Diagram)

### Mermaid Diagram
```mermaid
flowchart LR
    A[Local Commits] --> B[Checkpoint Command]
    B --> C[Bundle Commits into Packfile]
    C --> D[Upload Packfile to IPFS -> bundleCID]
    D --> E[Compute Merkle Root]
    E --> F[Blockchain Transaction: checkpoint(repoId, fromCommit, toCommit, bundleCID, merkleRoot)]
    F --> G[On-Chain Anchor Event]
```

### ASCII Fallback
```
Local Commits
     |
     v
[ checkpoint ]
     |
     v
Bundle into packfile
     |
     v
Upload to IPFS ---> bundleCID
     |
     v
Compute Merkle Root
     |
     v
On-chain tx: checkpoint(repoId, fromCommit, toCommit, bundleCID, merkleRoot)
     |
     v
On-chain anchor (verifiable event)
```

---

## 📂 Commit Metadata

Each commit is stored as an object:

```json
{
  "repoId": "unique-repo-id",
  "commitHash": "sha256-of-files",
  "parentHash": "previous-commit-hash",
  "author": "0xWalletAddress",
  "message": "commit message",
  "timestamp": "block-time",
  "ipfsCid": "Qm123abc..."
}
```

---

## ⚙️ Architecture

### 🧩 On-Chain (Smart Contract)

**Functions:**
- `createRepo(name)`
- `commit(repoId, commitHash, ipfsCid, message)`
- `checkpoint(repoId, fromCommit, toCommit, bundleCid, merkleRoot)`
- `getCommits(repoId)`

**Blockchain:** Ethereum (Sepolia / Polygon)  
**Identity:** Wallet addresses as commit authors.

### 🗄️ Off-Chain (IPFS)
- Store file contents or diffs.
- IPFS CIDs linked inside commit metadata.

### 💻 CLI (Node.js)
- **Framework:** `commander` or `oclif`
- **Blockchain Interaction:** `ethers.js`
- **Storage:** `ipfs-http-client`
- **Local Repo State:** JSON in `.bvc/`

---

## 🔑 Example CLI Usage

```bash
# Initialize repo
bvc init my-repo

# Add files
bvc add index.js

# Commit changes
bvc commit -m "Initial commit"

# View history
bvc log

# Push changes to blockchain
bvc push

# Pull updates
bvc pull

# Clone an existing repo
bvc clone 0x123abcRepo

# Create a checkpoint (batch push commits)
bvc checkpoint main
```

---

## 🎯 Roadmap

### ✅ Phase 1 – Core
- Repo creation (`init`)
- Commit metadata storage on-chain (`commit`)
- Basic log viewer

### 🔄 Phase 2 – Collaboration
- `clone`, `pull`, `push`
- File sync with IPFS

### 👥 Phase 3 – Governance
- Forks & merges
- DAO-based repo governance

### ✨ Phase 4 – Enhancements
- Checkpoint optimization (Merkle proofs, efficient packfiles)
- GUI frontend (like GitHub)
- Multi-chain support
- Optimized file storage (diff-based commits)