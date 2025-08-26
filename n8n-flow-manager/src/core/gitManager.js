import simpleGit from 'simple-git';
import path from 'path';
import { config } from '../config/config.js';

export class GitManager {
  constructor() {
    this.git = simpleGit();
    this.authorName = config.git.authorName;
    this.authorEmail = config.git.authorEmail;
  }

  async initialize() {
    try {
      const isRepo = await this.git.checkIsRepo();
      
      if (!isRepo) {
        await this.git.init();
        await this.setupGitConfig();
        await this.createInitialCommit();
      }
      
      await this.setupGitIgnore();
      return { success: true, message: 'Git repository initialized' };
    } catch (error) {
      throw new Error(`Failed to initialize Git: ${error.message}`);
    }
  }

  async setupGitConfig() {
    await this.git.addConfig('user.name', this.authorName);
    await this.git.addConfig('user.email', this.authorEmail);
  }

  async setupGitIgnore() {
    const gitignoreContent = `# n8n Flow Manager
node_modules/
.env
.env.local
*.log
.DS_Store
temp/
cache/

# Runtime files
*.pid
*.lock

# IDE files
.vscode/
.idea/
*.swp
*.swo
`;
    
    try {
      await this.git.checkoutLocalBranch('.gitignore');
      await this.git.raw(['reset', 'HEAD~1']);
    } catch {
      // .gitignore doesn't exist, create it
    }
    
    const fs = await import('fs/promises');
    await fs.writeFile('.gitignore', gitignoreContent);
    await this.git.add('.gitignore');
  }

  async createInitialCommit() {
    try {
      await this.git.add('.gitignore');
      await this.git.commit('Initial commit: Setup n8n Flow Manager repository');
    } catch (error) {
      // Initial commit might already exist
      console.log('Initial commit already exists or failed:', error.message);
    }
  }

  async commitFlow(filePath, message) {
    try {
      await this.git.add(filePath);
      const result = await this.git.commit(message, { '--author': `${this.authorName} <${this.authorEmail}>` });
      return {
        success: true,
        commit: result.commit,
        message: `Committed: ${message}`
      };
    } catch (error) {
      throw new Error(`Failed to commit flow: ${error.message}`);
    }
  }

  async commitAll(message) {
    try {
      await this.git.add('.');
      const result = await this.git.commit(message, { '--author': `${this.authorName} <${this.authorEmail}>` });
      return {
        success: true,
        commit: result.commit,
        message: `Committed: ${message}`
      };
    } catch (error) {
      throw new Error(`Failed to commit all changes: ${error.message}`);
    }
  }

  async createBranch(branchName) {
    try {
      await this.git.checkoutLocalBranch(branchName);
      return {
        success: true,
        branch: branchName,
        message: `Created and switched to branch: ${branchName}`
      };
    } catch (error) {
      throw new Error(`Failed to create branch ${branchName}: ${error.message}`);
    }
  }

  async switchBranch(branchName) {
    try {
      await this.git.checkout(branchName);
      return {
        success: true,
        branch: branchName,
        message: `Switched to branch: ${branchName}`
      };
    } catch (error) {
      throw new Error(`Failed to switch to branch ${branchName}: ${error.message}`);
    }
  }

  async getStatus() {
    try {
      const status = await this.git.status();
      return {
        success: true,
        status,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        staged: status.staged,
        current: status.current
      };
    } catch (error) {
      throw new Error(`Failed to get Git status: ${error.message}`);
    }
  }

  async getCommitHistory(limit = 10) {
    try {
      const log = await this.git.log({ maxCount: limit });
      return {
        success: true,
        commits: log.all.map(commit => ({
          hash: commit.hash,
          message: commit.message,
          author: commit.author_name,
          date: commit.date
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get commit history: ${error.message}`);
    }
  }

  async createTag(tagName, message) {
    try {
      await this.git.addAnnotatedTag(tagName, message);
      return {
        success: true,
        tag: tagName,
        message: `Created tag: ${tagName}`
      };
    } catch (error) {
      throw new Error(`Failed to create tag ${tagName}: ${error.message}`);
    }
  }

  async rollbackToCommit(commitHash) {
    try {
      await this.git.reset(['--hard', commitHash]);
      return {
        success: true,
        commit: commitHash,
        message: `Rolled back to commit: ${commitHash}`
      };
    } catch (error) {
      throw new Error(`Failed to rollback to commit ${commitHash}: ${error.message}`);
    }
  }

  async getDiff(file1, file2) {
    try {
      const diff = await this.git.diff([file1, file2]);
      return {
        success: true,
        diff
      };
    } catch (error) {
      throw new Error(`Failed to get diff: ${error.message}`);
    }
  }
}