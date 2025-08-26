import fs from 'fs/promises';
import path from 'path';
import { N8nClient } from '../api/n8nClient.js';
import { GitManager } from './gitManager.js';
import { config } from '../config/config.js';

export class FlowManager {
  constructor() {
    this.n8nClient = new N8nClient();
    this.gitManager = new GitManager();
    this.flowsDirectory = config.git.flowsDirectory;
    this.backupDirectory = config.git.backupDirectory;
  }

  async initialize() {
    await this.ensureDirectories();
    await this.gitManager.initialize();
  }

  async ensureDirectories() {
    for (const dir of [this.flowsDirectory, this.backupDirectory]) {
      try {
        await fs.access(dir);
      } catch {
        await fs.mkdir(dir, { recursive: true });
      }
    }
  }

  async exportWorkflow(workflowId, options = {}) {
    try {
      const workflow = await this.n8nClient.getWorkflow(workflowId);
      const fileName = this.sanitizeFileName(`${workflow.name || workflowId}.json`);
      const filePath = path.join(this.flowsDirectory, fileName);
      
      const exportData = {
        ...workflow,
        exportedAt: new Date().toISOString(),
        exportedBy: 'n8n-flow-manager',
        version: this.generateVersion()
      };

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
      
      if (options.autoCommit !== false) {
        await this.gitManager.commitFlow(filePath, `Export workflow: ${workflow.name || workflowId}`);
      }

      return {
        success: true,
        filePath,
        workflow: exportData,
        message: `Workflow exported to ${filePath}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Failed to export workflow ${workflowId}`
      };
    }
  }

  async exportAllWorkflows(options = {}) {
    try {
      const workflows = await this.n8nClient.getAllWorkflows();
      const results = [];
      
      for (const workflow of workflows) {
        const result = await this.exportWorkflow(workflow.id, { autoCommit: false });
        results.push(result);
      }
      
      if (options.autoCommit !== false) {
        const successCount = results.filter(r => r.success).length;
        await this.gitManager.commitAll(`Export ${successCount} workflows`);
      }

      return {
        success: true,
        results,
        message: `Exported ${results.filter(r => r.success).length} workflows`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to export workflows'
      };
    }
  }

  async importWorkflow(filePath, options = {}) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      const workflowData = JSON.parse(fileContent);
      
      if (options.backup && workflowData.id) {
        await this.backupWorkflow(workflowData.id);
      }
      
      const cleanWorkflowData = this.cleanWorkflowForImport(workflowData);
      
      let result;
      if (workflowData.id && options.update) {
        result = await this.n8nClient.updateWorkflow(workflowData.id, cleanWorkflowData);
      } else {
        result = await this.n8nClient.createWorkflow(cleanWorkflowData);
      }
      
      return {
        success: true,
        workflow: result,
        message: `Workflow imported successfully: ${result.name}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: `Failed to import workflow from ${filePath}`
      };
    }
  }

  async backupWorkflow(workflowId) {
    try {
      const workflow = await this.n8nClient.getWorkflow(workflowId);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${workflow.name || workflowId}_backup_${timestamp}.json`;
      const backupPath = path.join(this.backupDirectory, fileName);
      
      await fs.writeFile(backupPath, JSON.stringify(workflow, null, 2));
      return backupPath;
    } catch (error) {
      throw new Error(`Failed to backup workflow ${workflowId}: ${error.message}`);
    }
  }

  async compareWorkflows(localFilePath, workflowId) {
    try {
      const [localContent, remoteWorkflow] = await Promise.all([
        fs.readFile(localFilePath, 'utf8'),
        this.n8nClient.getWorkflow(workflowId)
      ]);
      
      const localWorkflow = JSON.parse(localContent);
      
      return {
        local: localWorkflow,
        remote: remoteWorkflow,
        differences: this.findDifferences(localWorkflow, remoteWorkflow)
      };
    } catch (error) {
      throw new Error(`Failed to compare workflows: ${error.message}`);
    }
  }

  cleanWorkflowForImport(workflowData) {
    const cleaned = { ...workflowData };
    delete cleaned.exportedAt;
    delete cleaned.exportedBy;
    delete cleaned.version;
    delete cleaned.createdAt;
    delete cleaned.updatedAt;
    return cleaned;
  }

  findDifferences(local, remote) {
    const differences = [];
    
    if (local.name !== remote.name) {
      differences.push({ field: 'name', local: local.name, remote: remote.name });
    }
    
    if (JSON.stringify(local.nodes) !== JSON.stringify(remote.nodes)) {
      differences.push({ field: 'nodes', type: 'structure_change' });
    }
    
    if (JSON.stringify(local.connections) !== JSON.stringify(remote.connections)) {
      differences.push({ field: 'connections', type: 'structure_change' });
    }
    
    return differences;
  }

  sanitizeFileName(fileName) {
    return fileName.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();
  }

  generateVersion() {
    return `v${Date.now()}`;
  }
}