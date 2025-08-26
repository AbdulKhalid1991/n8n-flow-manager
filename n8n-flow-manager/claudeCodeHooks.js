// Claude Code Integration Hooks for n8n Flow Manager
// Place this file in your Claude Code hooks directory or import in your existing hooks

import { claudeCodeIntegration } from './src/integration/claudeCodeIntegration.js';
import path from 'path';

export class N8nFlowManagerHooks {
  constructor() {
    this.integration = claudeCodeIntegration;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.integration.api.initialize();
      this.isInitialized = true;
      console.log('✅ n8n Flow Manager integration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize n8n Flow Manager:', error.message);
    }
  }

  // Hook: Execute when Claude Code receives instructions about n8n or workflows
  async onUserPromptSubmit(prompt, context = {}) {
    await this.initialize();

    // Check if the prompt is related to n8n or workflow management
    if (this.isN8nRelated(prompt)) {
      try {
        const result = await this.integration.executeTask(prompt, context);
        
        return {
          shouldIntercept: true,
          response: result.response,
          data: result.data,
          suggestions: result.suggestions,
          nextSteps: result.nextSteps,
          source: 'n8n-flow-manager'
        };
      } catch (error) {
        return {
          shouldIntercept: false,
          error: error.message
        };
      }
    }

    return { shouldIntercept: false };
  }

  // Hook: Execute before file operations to check if they affect workflows
  async onFileOperation(operation, filePath, content = null) {
    await this.initialize();

    // Check if operation affects workflow files
    if (this.isWorkflowFile(filePath)) {
      console.log(`🔄 n8n workflow file operation detected: ${operation} on ${filePath}`);
      
      try {
        if (operation === 'write' || operation === 'modify') {
          // Auto-analyze workflow changes
          const analysis = await this.integration.executeTask(
            `analyze workflow file ${filePath}`,
            { autoApprove: false, source: 'file-hook' }
          );
          
          return {
            analysis: analysis.data,
            suggestions: analysis.suggestions
          };
        }
      } catch (error) {
        console.error('Error analyzing workflow file:', error.message);
      }
    }

    return null;
  }

  // Hook: Execute after successful task completion
  async onTaskComplete(taskType, result) {
    await this.initialize();

    // Auto-suggest related n8n operations
    const suggestions = this.generateAutoSuggestions(taskType, result);
    
    if (suggestions.length > 0) {
      return {
        suggestions: suggestions,
        source: 'n8n-flow-manager-auto'
      };
    }

    return null;
  }

  // Hook: Execute on system health check
  async onHealthCheck() {
    await this.initialize();

    try {
      const healthStatus = await this.integration.getSystemHealth();
      
      return {
        component: 'n8n-flow-manager',
        status: healthStatus.success ? 'healthy' : 'unhealthy',
        details: healthStatus.status,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        component: 'n8n-flow-manager',
        status: 'error',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }

  // Helper methods
  isN8nRelated(prompt) {
    const n8nKeywords = [
      'n8n', 'workflow', 'flow', 'automation', 'node', 'trigger',
      'export workflow', 'import workflow', 'test workflow',
      'workflow analysis', 'flow manager', 'automate',
      'analyze system', 'fix issues', 'improve code', 'upgrade plan',
      'system health', 'enhancement', 'optimization'
    ];

    const promptLower = prompt.toLowerCase();
    return n8nKeywords.some(keyword => promptLower.includes(keyword));
  }

  isWorkflowFile(filePath) {
    const workflowExtensions = ['.json'];
    const workflowPaths = ['/flows/', '/workflows/', '/n8n-flows/'];
    
    const hasWorkflowExtension = workflowExtensions.some(ext => 
      filePath.toLowerCase().endsWith(ext)
    );
    
    const isInWorkflowPath = workflowPaths.some(workflowPath => 
      filePath.toLowerCase().includes(workflowPath)
    );

    return hasWorkflowExtension && isInWorkflowPath;
  }

  generateAutoSuggestions(taskType, result) {
    const suggestions = [];

    // Auto-suggest based on task completion
    switch (taskType) {
      case 'code_analysis':
        suggestions.push('Run n8n system analysis to check workflow health');
        suggestions.push('Export workflows for version control');
        break;

      case 'code_improvement':
        suggestions.push('Test workflows after code improvements');
        suggestions.push('Create n8n upgrade plan for strategic improvements');
        break;

      case 'git_commit':
        if (result.files && result.files.some(f => this.isWorkflowFile(f))) {
          suggestions.push('Export updated workflows from n8n');
          suggestions.push('Test affected workflows');
        }
        break;

      case 'deployment':
        suggestions.push('Verify n8n workflow deployment');
        suggestions.push('Run workflow integration tests');
        break;
    }

    return suggestions;
  }

  // Method for Claude Code to directly invoke n8n operations
  async invokeN8nOperation(operation, parameters = {}) {
    await this.initialize();

    const instruction = this.buildInstructionFromOperation(operation, parameters);
    return await this.integration.executeTask(instruction, parameters);
  }

  buildInstructionFromOperation(operation, parameters) {
    switch (operation) {
      case 'analyze':
        return parameters.detailed ? 'analyze system in detail' : 'analyze system';
      
      case 'improve':
        const priority = parameters.priority || 'high';
        return parameters.apply ? 
          `apply ${priority} priority improvements` : 
          `show ${priority} priority improvements`;
      
      case 'export':
        return parameters.workflowId ? 
          `export workflow ${parameters.workflowId}` : 
          'export all workflows';
      
      case 'import':
        return `import workflow ${parameters.filePath}`;
      
      case 'test':
        return parameters.workflowId ? 
          `test workflow ${parameters.workflowId}` : 
          'show available workflows for testing';
      
      case 'upgrade':
        return 'create upgrade plan';
      
      case 'status':
        return parameters.detailed ? 'show detailed system status' : 'show workflow status';
      
      case 'connection':
        return 'test n8n connection';
      
      default:
        return operation;
    }
  }

  // Get available operations for Claude Code
  getAvailableOperations() {
    return {
      analyze: 'Analyze system health and identify issues',
      improve: 'Apply automated improvements to fix issues',
      export: 'Export workflows from n8n for version control',
      import: 'Import workflows to n8n',
      test: 'Test workflow functionality and performance',
      upgrade: 'Create strategic upgrade plan',
      status: 'Show workflow and system status',
      connection: 'Test connection to n8n instance',
      enhance: 'Analyze and enhance specific workflows'
    };
  }

  // Get integration status
  getIntegrationStatus() {
    return {
      initialized: this.isInitialized,
      lastActivity: this.integration.activeTask?.timestamp || null,
      executionHistory: this.integration.getConversationHistory(5),
      context: this.integration.getContext()
    };
  }
}

// Export singleton instance
export const n8nFlowManagerHooks = new N8nFlowManagerHooks();

// Export hook functions for Claude Code to register
export async function handleUserPrompt(prompt, context) {
  return await n8nFlowManagerHooks.onUserPromptSubmit(prompt, context);
}

export async function handleFileOperation(operation, filePath, content) {
  return await n8nFlowManagerHooks.onFileOperation(operation, filePath, content);
}

export async function handleTaskComplete(taskType, result) {
  return await n8nFlowManagerHooks.onTaskComplete(taskType, result);
}

export async function handleHealthCheck() {
  return await n8nFlowManagerHooks.onHealthCheck();
}

// Direct invocation method for Claude Code
export async function invokeN8nFlowManager(operation, parameters) {
  return await n8nFlowManagerHooks.invokeN8nOperation(operation, parameters);
}

// Get available operations
export function getN8nOperations() {
  return n8nFlowManagerHooks.getAvailableOperations();
}

// Get integration status
export function getN8nStatus() {
  return n8nFlowManagerHooks.getIntegrationStatus();
}