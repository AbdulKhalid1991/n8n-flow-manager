import { claudeCodeAPI } from './claudeCodeAPI.js';

export class ClaudeCodeIntegration {
  constructor() {
    this.api = claudeCodeAPI;
    this.contextStack = [];
    this.conversationMemory = new Map();
    this.taskQueue = [];
    this.activeTask = null;
  }

  // Main entry point for Claude Code to execute n8n flow manager tasks
  async executeTask(instruction, context = {}) {
    try {
      // Add to context stack
      this.contextStack.push({ instruction, context, timestamp: Date.now() });
      
      // Parse and route the instruction
      const task = await this.parseAndRouteInstruction(instruction, context);
      
      // Execute the task
      const result = await this.executeInternalTask(task);
      
      // Store conversation memory
      this.storeConversationMemory(instruction, result);
      
      // Generate comprehensive response
      return this.generateClaudeCodeResponse(result, task);
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: `❌ Failed to execute n8n flow manager task: ${error.message}`,
        suggestions: [
          'Check if n8n Flow Manager is properly configured',
          'Verify the instruction is clear and specific',
          'Try breaking down complex requests into smaller steps'
        ]
      };
    }
  }

  async parseAndRouteInstruction(instruction, context) {
    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      instruction: instruction.toLowerCase(),
      originalInstruction: instruction,
      context: context,
      type: 'unknown',
      parameters: {},
      priority: context.priority || 'normal',
      requiresConfirmation: false
    };

    // Intelligent task classification
    task.type = this.classifyTaskType(instruction);
    task.parameters = this.extractTaskParameters(instruction, task.type);
    task.requiresConfirmation = this.shouldRequireConfirmation(task);

    return task;
  }

  classifyTaskType(instruction) {
    const instruction_lower = instruction.toLowerCase();

    // System analysis and health
    if (this.matchesPattern(instruction_lower, [
      'analyze', 'check health', 'system status', 'health check', 'scan system',
      'what issues', 'problems', 'diagnose', 'inspect system'
    ])) {
      return 'system_analysis';
    }

    // System improvements
    if (this.matchesPattern(instruction_lower, [
      'improve', 'fix', 'optimize', 'enhance', 'repair', 'solve issues',
      'apply fixes', 'make improvements', 'auto-fix', 'resolve problems'
    ])) {
      return 'system_improvement';
    }

    // Upgrade planning
    if (this.matchesPattern(instruction_lower, [
      'upgrade plan', 'roadmap', 'strategic plan', 'improvement plan',
      'plan upgrade', 'create plan', 'upgrade path', 'future planning'
    ])) {
      return 'upgrade_planning';
    }

    // Workflow export
    if (this.matchesPattern(instruction_lower, [
      'export', 'save workflows', 'backup workflows', 'download',
      'extract workflows', 'get workflows'
    ])) {
      return 'workflow_export';
    }

    // Workflow import
    if (this.matchesPattern(instruction_lower, [
      'import', 'upload workflow', 'load workflow', 'restore workflow',
      'deploy workflow', 'install workflow'
    ])) {
      return 'workflow_import';
    }

    // Workflow testing
    if (this.matchesPattern(instruction_lower, [
      'test', 'validate workflow', 'check workflow', 'verify workflow',
      'run tests', 'test functionality'
    ])) {
      return 'workflow_testing';
    }

    // Status and listing
    if (this.matchesPattern(instruction_lower, [
      'list', 'show', 'status', 'what workflows', 'display workflows',
      'current workflows', 'workflow list'
    ])) {
      return 'status_listing';
    }

    // Workflow enhancement
    if (this.matchesPattern(instruction_lower, [
      'enhance workflow', 'optimize workflow', 'improve workflow',
      'workflow analysis', 'analyze workflow'
    ])) {
      return 'workflow_enhancement';
    }

    // Connection testing
    if (this.matchesPattern(instruction_lower, [
      'test connection', 'check connection', 'connection status',
      'verify connection', 'n8n connection'
    ])) {
      return 'connection_test';
    }

    return 'general_query';
  }

  matchesPattern(text, patterns) {
    return patterns.some(pattern => 
      text.includes(pattern) || 
      pattern.split(' ').every(word => text.includes(word))
    );
  }

  extractTaskParameters(instruction, taskType) {
    const params = {};
    const instruction_lower = instruction.toLowerCase();

    // Extract workflow ID
    const workflowIdPattern = /workflow[\s:]*([\w-]+)/i;
    const workflowMatch = instruction.match(workflowIdPattern);
    if (workflowMatch) {
      params.workflowId = workflowMatch[1];
    }

    // Extract file path
    const filePathPattern = /file[\s:]*([^\s]+\.json)/i;
    const fileMatch = instruction.match(filePathPattern);
    if (fileMatch) {
      params.filePath = fileMatch[1];
    }

    // Extract priority
    if (instruction_lower.includes('critical') || instruction_lower.includes('urgent') || instruction_lower.includes('immediate')) {
      params.priority = 'critical';
    } else if (instruction_lower.includes('high priority') || instruction_lower.includes('important')) {
      params.priority = 'high';
    } else if (instruction_lower.includes('low priority') || instruction_lower.includes('minor')) {
      params.priority = 'low';
    }

    // Extract action modifiers
    params.dryRun = instruction_lower.includes('dry run') || 
                    instruction_lower.includes('preview') || 
                    instruction_lower.includes('show what would');

    params.apply = instruction_lower.includes('apply') || 
                   instruction_lower.includes('execute') || 
                   instruction_lower.includes('do it') ||
                   instruction_lower.includes('fix it');

    params.detailed = instruction_lower.includes('detailed') || 
                      instruction_lower.includes('comprehensive') ||
                      instruction_lower.includes('full analysis');

    params.all = instruction_lower.includes('all workflows') || 
                 instruction_lower.includes('every workflow') ||
                 instruction_lower.includes('all flows');

    // Extract specific workflow states
    if (instruction_lower.includes('active workflows')) {
      params.activeOnly = true;
    } else if (instruction_lower.includes('inactive workflows')) {
      params.inactiveOnly = true;
    }

    return params;
  }

  shouldRequireConfirmation(task) {
    // Require confirmation for potentially destructive or significant operations
    const destructiveTypes = ['system_improvement', 'workflow_import'];
    const hasApplyFlag = task.parameters.apply;
    const isCritical = task.parameters.priority === 'critical';
    
    return (destructiveTypes.includes(task.type) && hasApplyFlag) || 
           (isCritical && hasApplyFlag);
  }

  async executeInternalTask(task) {
    this.activeTask = task;

    try {
      switch (task.type) {
        case 'system_analysis':
          return await this.executeSystemAnalysis(task);
        
        case 'system_improvement':
          return await this.executeSystemImprovement(task);
        
        case 'upgrade_planning':
          return await this.executeUpgradePlanning(task);
        
        case 'workflow_export':
          return await this.executeWorkflowExport(task);
        
        case 'workflow_import':
          return await this.executeWorkflowImport(task);
        
        case 'workflow_testing':
          return await this.executeWorkflowTesting(task);
        
        case 'status_listing':
          return await this.executeStatusListing(task);
        
        case 'workflow_enhancement':
          return await this.executeWorkflowEnhancement(task);
        
        case 'connection_test':
          return await this.executeConnectionTest(task);
        
        case 'general_query':
          return await this.executeGeneralQuery(task);
        
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } finally {
      this.activeTask = null;
    }
  }

  async executeSystemAnalysis(task) {
    const options = {
      detailed: task.parameters.detailed
    };

    const result = await this.api.analyzeSystem(options);
    
    return {
      ...result,
      taskType: 'system_analysis',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeSystemImprovement(task) {
    const options = {
      dryRun: task.parameters.apply ? false : true, // Default to dry run unless explicitly applying
      priority: task.parameters.priority || 'high',
      autoApply: task.context.autoApprove || false
    };

    const result = await this.api.improveSystem(options);
    
    return {
      ...result,
      taskType: 'system_improvement',
      executedAt: new Date().toISOString(),
      parameters: task.parameters,
      isPreview: options.dryRun
    };
  }

  async executeUpgradePlanning(task) {
    const options = {
      targetVersion: task.parameters.target || 'latest',
      timeline: task.parameters.timeline || 'flexible',
      riskTolerance: task.parameters.risk || 'medium'
    };

    const result = await this.api.createUpgradePlan(options);
    
    return {
      ...result,
      taskType: 'upgrade_planning',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeWorkflowExport(task) {
    const options = {
      workflowId: task.parameters.workflowId,
      autoCommit: !task.parameters.noCommit
    };

    const result = await this.api.exportWorkflows(options);
    
    return {
      ...result,
      taskType: 'workflow_export',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeWorkflowImport(task) {
    if (!task.parameters.filePath) {
      throw new Error('File path is required for workflow import');
    }

    const options = {
      update: task.parameters.update !== false,
      backup: task.parameters.backup !== false
    };

    const result = await this.api.importWorkflow(task.parameters.filePath, options);
    
    return {
      ...result,
      taskType: 'workflow_import',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeWorkflowTesting(task) {
    if (!task.parameters.workflowId) {
      // If no specific workflow, get list of available workflows
      const listResult = await this.api.getWorkflowList({ active: true });
      return {
        ...listResult,
        taskType: 'workflow_testing',
        message: 'Please specify a workflow ID to test',
        availableWorkflows: listResult.workflows?.slice(0, 10)
      };
    }

    const result = await this.api.testWorkflow(task.parameters.workflowId);
    
    return {
      ...result,
      taskType: 'workflow_testing',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeStatusListing(task) {
    const options = {
      active: task.parameters.activeOnly ? true : 
              task.parameters.inactiveOnly ? false : undefined
    };

    if (task.parameters.detailed) {
      const [workflowList, systemStatus] = await Promise.all([
        this.api.getWorkflowList(options),
        this.api.getSystemStatus()
      ]);

      return {
        success: true,
        taskType: 'status_listing',
        workflows: workflowList,
        systemStatus: systemStatus,
        executedAt: new Date().toISOString(),
        parameters: task.parameters
      };
    } else {
      const result = await this.api.getWorkflowList(options);
      return {
        ...result,
        taskType: 'status_listing',
        executedAt: new Date().toISOString(),
        parameters: task.parameters
      };
    }
  }

  async executeWorkflowEnhancement(task) {
    if (!task.parameters.workflowId) {
      throw new Error('Workflow ID is required for workflow enhancement');
    }

    const result = await this.api.enhanceWorkflow(task.parameters.workflowId);
    
    return {
      ...result,
      taskType: 'workflow_enhancement',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeConnectionTest(task) {
    const result = await this.api.getSystemStatus();
    
    return {
      success: true,
      taskType: 'connection_test',
      connectionStatus: result.status?.n8nConnection || 'unknown',
      connectionMessage: result.status?.connectionMessage || 'No message available',
      systemStatus: result.status,
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeGeneralQuery(task) {
    // Handle general queries about capabilities
    const commands = await this.api.getAvailableCommands();
    
    return {
      success: true,
      taskType: 'general_query',
      message: 'I can help you manage n8n workflows with various operations',
      availableCommands: commands.commands,
      examples: [
        'Analyze the system for issues',
        'Export all workflows',
        'Test workflow abc123',
        'Create an upgrade plan',
        'Fix all critical issues',
        'List active workflows'
      ],
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  generateClaudeCodeResponse(result, task) {
    const response = {
      success: result.success,
      data: result,
      task: {
        type: task.type,
        instruction: task.originalInstruction,
        parameters: task.parameters
      }
    };

    // Generate human-readable response
    response.response = this.generateResponseMessage(result, task);
    
    // Generate follow-up suggestions
    response.suggestions = this.generateFollowUpSuggestions(result, task);
    
    // Generate next steps
    response.nextSteps = this.generateNextSteps(result, task);

    return response;
  }

  generateResponseMessage(result, task) {
    if (!result.success) {
      return `❌ ${task.type.replace('_', ' ')} failed: ${result.error}`;
    }

    const taskType = result.taskType || task.type;
    
    switch (taskType) {
      case 'system_analysis':
        const rating = result.summary?.overallRating || 'Unknown';
        const issues = result.summary?.totalIssues || 0;
        const critical = result.summary?.criticalIssues || 0;
        
        if (critical > 0) {
          return `⚠️ System analysis complete. Found ${critical} critical issues and ${issues} total issues. Overall rating: ${rating}. Immediate attention required.`;
        } else if (issues > 0) {
          return `📊 System analysis complete. Found ${issues} issues. Overall rating: ${rating}. Consider applying improvements.`;
        } else {
          return `✅ System analysis complete. No critical issues found. Overall rating: ${rating}. System is healthy.`;
        }

      case 'system_improvement':
        if (result.isPreview) {
          const tasks = result.applied ? 0 : (result.tasksCompleted || 0);
          return `📋 System improvement preview: ${tasks} automated fixes available. Use 'apply improvements' to execute them.`;
        } else {
          const completed = result.tasksCompleted || 0;
          const failed = result.tasksFailed || 0;
          return `🔧 System improvements applied: ${completed} tasks completed${failed > 0 ? `, ${failed} failed` : ''}. System enhanced successfully.`;
        }

      case 'upgrade_planning':
        const phases = result.phases || 0;
        const weeks = result.estimatedWeeks || 0;
        const riskLevel = result.riskLevel || 'unknown';
        return `🗺️ Upgrade plan created: ${phases} phases over ${weeks} weeks. Risk level: ${riskLevel}. Strategic roadmap ready for implementation.`;

      case 'workflow_export':
        const exported = result.exported || 0;
        const failed = result.failed || 0;
        return `📤 Workflow export complete: ${exported} workflows exported${failed > 0 ? `, ${failed} failed` : ''}. Files saved and version controlled.`;

      case 'workflow_import':
        return result.success ? 
          `📥 Workflow "${result.workflow?.name}" imported successfully to n8n.` :
          `❌ Workflow import failed: ${result.error}`;

      case 'workflow_testing':
        if (result.availableWorkflows) {
          const count = result.availableWorkflows.length;
          return `📋 Found ${count} active workflows available for testing. Please specify a workflow ID.`;
        } else {
          const status = result.status || 'unknown';
          const duration = result.duration || 'N/A';
          return `🧪 Workflow test ${status}: Duration ${duration}ms. ${result.errors?.length || 0} errors, ${result.warnings?.length || 0} warnings.`;
        }

      case 'status_listing':
        const total = result.workflows?.total || 0;
        const active = result.workflows?.active || 0;
        const inactive = result.workflows?.inactive || 0;
        
        if (result.systemStatus) {
          const connection = result.systemStatus.status?.n8nConnection || 'unknown';
          const health = result.systemStatus.status?.overallHealth || 'unknown';
          return `📊 System status: ${total} workflows (${active} active, ${inactive} inactive). Connection: ${connection}. Health: ${health}.`;
        } else {
          return `📊 Workflow status: ${total} workflows found (${active} active, ${inactive} inactive).`;
        }

      case 'workflow_enhancement':
        const workflowName = result.workflowName || 'Unknown';
        const issues = result.issues || 0;
        const suggestions = result.suggestions || 0;
        const optimizations = result.optimizations || 0;
        return `⚡ Workflow "${workflowName}" analysis: ${issues} issues, ${suggestions} suggestions, ${optimizations} optimizations available.`;

      case 'connection_test':
        const connectionStatus = result.connectionStatus || 'unknown';
        return connectionStatus === 'connected' ? 
          `✅ n8n connection successful. System is ready for workflow management.` :
          `❌ n8n connection failed. Check configuration and server status.`;

      case 'general_query':
        return `🤖 n8n Flow Manager is ready to help. I can analyze systems, manage workflows, apply improvements, and create upgrade plans.`;

      default:
        return result.message || 'Operation completed successfully.';
    }
  }

  generateFollowUpSuggestions(result, task) {
    const suggestions = [];
    const taskType = result.taskType || task.type;

    switch (taskType) {
      case 'system_analysis':
        if (result.summary?.criticalIssues > 0) {
          suggestions.push('Apply critical fixes immediately');
          suggestions.push('Create detailed improvement plan');
        } else if (result.summary?.totalIssues > 0) {
          suggestions.push('Review specific issues in detail');
          suggestions.push('Apply automated improvements');
        }
        suggestions.push('Create strategic upgrade plan');
        break;

      case 'system_improvement':
        if (result.isPreview) {
          suggestions.push('Apply the proposed improvements');
          suggestions.push('Review changes before applying');
        } else {
          suggestions.push('Verify improvements with new analysis');
          suggestions.push('Test workflows after changes');
        }
        break;

      case 'upgrade_planning':
        suggestions.push('Start with Phase 1 implementation');
        suggestions.push('Set up project tracking');
        suggestions.push('Review resource allocation');
        break;

      case 'workflow_export':
        suggestions.push('Review exported workflow files');
        suggestions.push('Test exported workflows');
        suggestions.push('Check version control status');
        break;

      case 'workflow_import':
        if (result.success) {
          suggestions.push('Test imported workflow');
          suggestions.push('Verify workflow configuration');
        } else {
          suggestions.push('Check file format and content');
          suggestions.push('Review error details');
        }
        break;

      case 'workflow_testing':
        if (result.errors?.length > 0) {
          suggestions.push('Fix identified workflow issues');
        } else {
          suggestions.push('Workflow is ready for production');
        }
        break;
    }

    return suggestions;
  }

  generateNextSteps(result, task) {
    const steps = [];
    
    if (!result.success) {
      steps.push('Check system configuration');
      steps.push('Review error message details');
      steps.push('Try simpler operations first');
      return steps;
    }

    // Add task-specific next steps based on the API response
    if (result.taskType === 'system_analysis' && result.summary?.criticalIssues > 0) {
      steps.push('Execute: fix critical issues immediately');
    } else if (result.taskType === 'system_improvement' && result.isPreview) {
      steps.push('Execute: apply the improvements');
    }

    steps.push('Continue with related workflow management tasks');
    return steps;
  }

  storeConversationMemory(instruction, result) {
    const memoryKey = Date.now().toString();
    this.conversationMemory.set(memoryKey, {
      instruction,
      result: {
        success: result.success,
        taskType: result.taskType,
        summary: result.summary
      },
      timestamp: new Date().toISOString()
    });

    // Keep only last 50 conversation entries
    if (this.conversationMemory.size > 50) {
      const firstKey = this.conversationMemory.keys().next().value;
      this.conversationMemory.delete(firstKey);
    }
  }

  // Public methods for Claude Code to use
  async getSystemHealth() {
    return await this.api.getSystemStatus();
  }

  async getWorkflowList(filters = {}) {
    return await this.api.getWorkflowList(filters);
  }

  async getExecutionHistory(limit = 10) {
    return await this.api.getExecutionHistory(limit);
  }

  getConversationHistory(limit = 10) {
    const entries = Array.from(this.conversationMemory.values());
    return entries.slice(-limit);
  }

  // Context management
  getContext() {
    return {
      currentTask: this.activeTask,
      contextStack: this.contextStack.slice(-5), // Last 5 contexts
      conversationHistory: this.getConversationHistory(5)
    };
  }
}

// Export singleton instance for Claude Code to use
export const claudeCodeIntegration = new ClaudeCodeIntegration();