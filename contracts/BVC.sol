// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BVC {
    struct Repository {
        string name;
        address owner;
        uint256 createdAt;
        bool exists;
    }

    struct Commit {
        string commitHash;
        string parentHash;
        address author;
        string message;
        uint256 timestamp;
        string ipfsCid;
    }

    struct Checkpoint {
        string fromCommit;
        string toCommit;
        string bundleCid;
        string merkleRoot;
        uint256 timestamp;
    }

    // State variables
    mapping(string => Repository) public repositories;
    mapping(string => Commit[]) public commits;
    mapping(string => Checkpoint[]) public checkpoints;

    string[] public repoIds;

    // Events
    event RepositoryCreated(string repoId, string name, address owner);
    event CommitRecorded(string repoId, string commitHash, string ipfsCid);
    event CheckpointCreated(string repoId, string fromCommit, string toCommit, string bundleCid);

    // Modifiers
    modifier onlyRepoOwner(string memory repoId) {
        require(repositories[repoId].owner == msg.sender, "Not repository owner");
        _;
    }

    modifier repoExists(string memory repoId) {
        require(repositories[repoId].exists, "Repository does not exist");
        _;
    }

    // Functions
    function createRepo(string memory name) external returns (string memory) {
        // Generate repoId (simplified - in production use proper ID generation)
        string memory repoId = string(abi.encodePacked(name, "-", uint2str(uint256(uint160(msg.sender)))));

        require(!repositories[repoId].exists, "Repository already exists");

        repositories[repoId] = Repository({
            name: name,
            owner: msg.sender,
            createdAt: block.timestamp,
            exists: true
        });

        repoIds.push(repoId);

        emit RepositoryCreated(repoId, name, msg.sender);
        return repoId;
    }

    function commit(
        string memory repoId,
        string memory commitHash,
        string memory ipfsCid,
        string memory message
    ) external repoExists(repoId) onlyRepoOwner(repoId) {
        Commit memory newCommit = Commit({
            commitHash: commitHash,
            parentHash: commits[repoId].length > 0 ?
                commits[repoId][commits[repoId].length - 1].commitHash : "",
            author: msg.sender,
            message: message,
            timestamp: block.timestamp,
            ipfsCid: ipfsCid
        });

        commits[repoId].push(newCommit);

        emit CommitRecorded(repoId, commitHash, ipfsCid);
    }

    function checkpoint(
        string memory repoId,
        string memory fromCommit,
        string memory toCommit,
        string memory bundleCid,
        string memory merkleRoot
    ) external repoExists(repoId) onlyRepoOwner(repoId) {
        Checkpoint memory newCheckpoint = Checkpoint({
            fromCommit: fromCommit,
            toCommit: toCommit,
            bundleCid: bundleCid,
            merkleRoot: merkleRoot,
            timestamp: block.timestamp
        });

        checkpoints[repoId].push(newCheckpoint);

        emit CheckpointCreated(repoId, fromCommit, toCommit, bundleCid);
    }

    function getCommits(string memory repoId) external view returns (Commit[] memory) {
        return commits[repoId];
    }

    function getCheckpoints(string memory repoId) external view returns (Checkpoint[] memory) {
        return checkpoints[repoId];
    }

    function getRepository(string memory repoId) external view returns (Repository memory) {
        return repositories[repoId];
    }

    function getAllRepoIds() external view returns (string[] memory) {
        return repoIds;
    }

    // Utility function for string conversion
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }
}
