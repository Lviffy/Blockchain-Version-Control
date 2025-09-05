const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BVC", function () {
  let bvc;
  let owner;
  let addr1;

  beforeEach(async function () {
    const BVC = await ethers.getContractFactory("BVC");
    [owner, addr1] = await ethers.getSigners();
    bvc = await BVC.deploy();
    await bvc.deployed();
  });

  describe("Repository Creation", function () {
    it("Should create a repository", async function () {
      const repoName = "test-repo";
      const tx = await bvc.createRepo(repoName);
      await tx.wait();

      const repoId = await bvc.getAllRepoIds();
      expect(repoId.length).to.equal(1);

      const repo = await bvc.getRepository(repoId[0]);
      expect(repo.name).to.equal(repoName);
      expect(repo.owner).to.equal(owner.address);
      expect(repo.exists).to.equal(true);
    });

    it("Should not allow duplicate repository names", async function () {
      const repoName = "test-repo";
      await bvc.createRepo(repoName);

      await expect(bvc.createRepo(repoName)).to.be.revertedWith("Repository already exists");
    });
  });

  describe("Commits", function () {
    let repoId;

    beforeEach(async function () {
      const tx = await bvc.createRepo("test-repo");
      await tx.wait();
      const repoIds = await bvc.getAllRepoIds();
      repoId = repoIds[0];
    });

    it("Should record a commit", async function () {
      const commitHash = "abc123";
      const ipfsCid = "Qm123";
      const message = "Initial commit";

      await bvc.commit(repoId, commitHash, ipfsCid, message);

      const commits = await bvc.getCommits(repoId);
      expect(commits.length).to.equal(1);
      expect(commits[0].commitHash).to.equal(commitHash);
      expect(commits[0].ipfsCid).to.equal(ipfsCid);
      expect(commits[0].message).to.equal(message);
      expect(commits[0].author).to.equal(owner.address);
    });

    it("Should not allow commits from non-owners", async function () {
      const commitHash = "abc123";
      const ipfsCid = "Qm123";
      const message = "Initial commit";

      await expect(
        bvc.connect(addr1).commit(repoId, commitHash, ipfsCid, message)
      ).to.be.revertedWith("Not repository owner");
    });
  });

  describe("Checkpoints", function () {
    let repoId;

    beforeEach(async function () {
      const tx = await bvc.createRepo("test-repo");
      await tx.wait();
      const repoIds = await bvc.getAllRepoIds();
      repoId = repoIds[0];
    });

    it("Should create a checkpoint", async function () {
      const fromCommit = "commit1";
      const toCommit = "commit2";
      const bundleCid = "QmBundle";
      const merkleRoot = "root123";

      await bvc.checkpoint(repoId, fromCommit, toCommit, bundleCid, merkleRoot);

      const checkpoints = await bvc.getCheckpoints(repoId);
      expect(checkpoints.length).to.equal(1);
      expect(checkpoints[0].fromCommit).to.equal(fromCommit);
      expect(checkpoints[0].toCommit).to.equal(toCommit);
      expect(checkpoints[0].bundleCid).to.equal(bundleCid);
      expect(checkpoints[0].merkleRoot).to.equal(merkleRoot);
    });
  });
});
