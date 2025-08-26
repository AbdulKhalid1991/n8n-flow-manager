// Main exports for Claude Code integration
export { ClaudeCodeBridge } from './claudeCodeBridge.js';
export { ClaudeCodeAPI, claudeCodeAPI } from './claudeCodeAPI.js';
export { ClaudeCodeIntegration, claudeCodeIntegration } from './claudeCodeIntegration.js';

// Quick start function for Claude Code
export async function initializeN8nFlowManager(options = {}) {
  const { claudeCodeAPI } = await import('./claudeCodeAPI.js');
  
  try {
    const success = await claudeCodeAPI.initialize();
    
    if (success) {
      console.log('✅ n8n Flow Manager initialized for Claude Code integration');
      return {
        success: true,
        api: claudeCodeAPI,
        message: 'Ready for natural language workflow management commands'
      };
    } else {
      return {
        success: false,
        error: 'Failed to initialize n8n Flow Manager',
        suggestion: 'Check n8n configuration and server status'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestion: 'Verify n8n Flow Manager installation and configuration'
    };
  }
}

// Execute natural language commands
export async function executeN8nCommand(instruction, context = {}) {
  const { claudeCodeIntegration } = await import('./claudeCodeIntegration.js');
  return await claudeCodeIntegration.executeTask(instruction, context);
}

// Get system status for Claude Code dashboard
export async function getN8nSystemStatus() {
  const { claudeCodeAPI } = await import('./claudeCodeAPI.js');
  return await claudeCodeAPI.getSystemStatus();
}

// Health check for Claude Code monitoring
export async function performHealthCheck() {
  const { claudeCodeAPI } = await import('./claudeCodeAPI.js');
  
  try {
    const status = await claudeCodeAPI.getSystemStatus();
    return {
      component: 'n8n-flow-manager',
      status: status.success ? 'healthy' : 'unhealthy',
      details: status.status || {},
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      component: 'n8n-flow-manager',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Available operations for Claude Code UI
export function getAvailableOperations() {
  return {
    analyze: {
      description: 'Analyze system health and identify issues',
      examples: ['analyze the system', 'check for problems', 'system health check'],
      parameters: ['detailed']
    },
    improve: {
      description: 'Apply automated improvements to fix issues',  
      examples: ['fix all issues', 'apply improvements', 'resolve problems'],
      parameters: ['priority', 'apply', 'dryRun']
    },
    export: {
      description: 'Export workflows from n8n',
      examples: ['export all workflows', 'backup workflows', 'save flows'],
      parameters: ['workflowId', 'all']
    },
    import: {
      description: 'Import workflows to n8n',
      examples: ['import workflow file.json', 'load workflow', 'restore workflow'],
      parameters: ['filePath', 'update', 'backup']
    },
    test: {
      description: 'Test workflow functionality',
      examples: ['test workflow abc123', 'validate workflow', 'check workflow'],
      parameters: ['workflowId']
    },
    upgrade: {
      description: 'Create strategic upgrade plan',
      examples: ['create upgrade plan', 'plan improvements', 'roadmap'],
      parameters: ['timeline', 'risk']
    },
    status: {
      description: 'Show workflow and system status',
      examples: ['show status', 'list workflows', 'current state'],
      parameters: ['detailed', 'active']
    },
    connection: {
      description: 'Test connection to n8n instance',
      examples: ['test n8n connection', 'check connection', 'verify connection'],
      parameters: []
    }
  };
}