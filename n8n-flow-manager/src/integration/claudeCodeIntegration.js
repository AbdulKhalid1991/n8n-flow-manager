import { claudeCodeAPI } from './claudeCodeAPI.js';
import { mcpBridge } from './mcpBridge.js';
import { workflowRepository } from './workflowRepository.js';

export class ClaudeCodeIntegration {
  constructor() {
    this.api = claudeCodeAPI;
    this.mcpBridge = mcpBridge;
    this.workflowRepository = workflowRepository;
    this.contextStack = [];
    this.conversationMemory = new Map();
    this.taskQueue = [];
    this.activeTask = null;
    this.mcpInitialized = false;
    this.workflowRepoInitialized = false;
  }

  // Main entry point for Claude Code to execute n8n flow manager tasks
  async executeTask(instruction, context = {}) {
    try {
      // Initialize MCP Bridge if not already done
      if (!this.mcpInitialized) {
        await this.initializeMCP();
      }

      // Initialize Workflow Repository if not already done
      if (!this.workflowRepoInitialized) {
        await this.initializeWorkflowRepository();
      }

      // Add to context stack
      this.contextStack.push({ instruction, context, timestamp: Date.now() });
      
      // Parse and route the instruction with MCP enhancement
      const task = await this.parseAndRouteInstruction(instruction, context);
      
      // Execute the task with MCP support
      const result = await this.executeInternalTask(task);
      
      // Store conversation memory
      this.storeConversationMemory(instruction, result);
      
      // Generate comprehensive response with MCP insights
      return this.generateClaudeCodeResponse(result, task);
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        response: `❌ Failed to execute n8n flow manager task: ${error.message}`,
        suggestions: [
          'Check if n8n Flow Manager is properly configured',
          'Verify the instruction is clear and specific',
          'Try breaking down complex requests into smaller steps',
          'Consider using MCP-enhanced workflow assistance'
        ]
      };
    }
  }

  // Initialize MCP Bridge
  async initializeMCP() {
    try {
      const mcpResult = await this.mcpBridge.initialize();
      this.mcpInitialized = mcpResult.success;
      
      if (this.mcpInitialized) {
        console.log('✅ MCP Bridge initialized - AI-enhanced workflow support enabled');
      } else {
        console.log('⚠️ MCP Bridge not available - using standard workflow management');
      }
    } catch (error) {
      console.log('⚠️ MCP initialization failed:', error.message);
      this.mcpInitialized = false;
    }
  }

  // Initialize Workflow Repository
  async initializeWorkflowRepository() {
    try {
      const repoResult = await this.workflowRepository.initialize();
      this.workflowRepoInitialized = repoResult.success;
      
      if (this.workflowRepoInitialized) {
        console.log(`✅ Workflow Repository initialized - ${repoResult.totalWorkflows} reference workflows available`);
      } else {
        console.log('⚠️ Workflow Repository not available - using basic workflow generation');
      }
    } catch (error) {
      console.log('⚠️ Workflow Repository initialization failed:', error.message);
      this.workflowRepoInitialized = false;
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

    // MCP-Enhanced Operations
    if (this.matchesPattern(instruction_lower, [
      'search nodes', 'find nodes', 'node search', 'available nodes',
      'what nodes', 'which nodes', 'node types'
    ])) {
      return 'mcp_node_search';
    }

    if (this.matchesPattern(instruction_lower, [
      'node info', 'node details', 'node properties', 'how to use',
      'node configuration', 'node parameters'
    ])) {
      return 'mcp_node_info';
    }

    if (this.matchesPattern(instruction_lower, [
      'validate workflow', 'check workflow', 'workflow validation',
      'verify workflow', 'workflow errors'
    ])) {
      return 'mcp_workflow_validation';
    }

    if (this.matchesPattern(instruction_lower, [
      'generate workflow', 'create workflow', 'build workflow',
      'workflow for', 'automate task', 'ai workflow'
    ])) {
      return 'mcp_workflow_generation';
    }

    if (this.matchesPattern(instruction_lower, [
      'enhance workflow', 'optimize workflow', 'improve workflow',
      'workflow suggestions', 'workflow optimization', 'ai enhance'
    ])) {
      return 'mcp_workflow_enhancement';
    }

    // Workflow Repository Operations
    if (this.matchesPattern(instruction_lower, [
      'search workflows', 'find workflow templates', 'workflow examples',
      'reference workflows', 'similar workflows', 'workflow library'
    ])) {
      return 'workflow_search';
    }

    if (this.matchesPattern(instruction_lower, [
      'workflow recommendations', 'suggest workflows', 'recommend workflow',
      'workflow for task', 'best workflow for', 'workflow templates for'
    ])) {
      return 'workflow_recommendations';
    }

    if (this.matchesPattern(instruction_lower, [
      'create workflow based on', 'generate workflow using', 'workflow from template',
      'build workflow like', 'copy workflow structure', 'use workflow as reference'
    ])) {
      return 'reference_based_generation';
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

        // MCP-Enhanced Operations
        case 'mcp_node_search':
          return await this.executeMCPNodeSearch(task);

        case 'mcp_node_info':
          return await this.executeMCPNodeInfo(task);

        case 'mcp_workflow_validation':
          return await this.executeMCPWorkflowValidation(task);

        case 'mcp_workflow_generation':
          return await this.executeMCPWorkflowGeneration(task);

        case 'mcp_workflow_enhancement':
          return await this.executeMCPWorkflowEnhancement(task);

        // Workflow Repository Operations
        case 'workflow_search':
          return await this.executeWorkflowSearch(task);

        case 'workflow_recommendations':
          return await this.executeWorkflowRecommendations(task);

        case 'reference_based_generation':
          return await this.executeReferenceBasedGeneration(task);
        
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
    
    const capabilities = {
      standard: [
        'Analyze the system for issues',
        'Export all workflows',
        'Test workflow abc123',
        'Create an upgrade plan',
        'Fix all critical issues',
        'List active workflows'
      ],
      mcpEnhanced: this.mcpInitialized ? [
        'Search available n8n nodes',
        'Get detailed node information',
        'Validate workflow structure',
        'Generate AI-powered workflows',
        'Enhance existing workflows',
        'Get node usage recommendations'
      ] : [],
      workflowRepository: this.workflowRepoInitialized ? [
        'Search workflow templates from 7,453+ references',
        'Get workflow recommendations for specific tasks',
        'Create workflows based on existing templates',
        'Find similar workflows for your use case',
        'Access high-quality workflow examples'
      ] : []
    };
    
    return {
      success: true,
      taskType: 'general_query',
      message: 'I can help you manage n8n workflows with various operations' + 
               (this.mcpInitialized ? ' including AI-enhanced features' : '') +
               (this.workflowRepoInitialized ? ' and access to 7,453+ workflow templates' : ''),
      availableCommands: commands.commands,
      examples: [...capabilities.standard, ...capabilities.mcpEnhanced, ...capabilities.workflowRepository],
      mcpEnhanced: this.mcpInitialized,
      workflowRepository: this.workflowRepoInitialized,
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  // MCP-Enhanced Execution Methods

  async executeMCPNodeSearch(task) {
    if (!this.mcpInitialized) {
      return {
        success: false,
        taskType: 'mcp_node_search',
        message: 'MCP Bridge not available. Using standard search.',
        fallback: true
      };
    }

    const query = task.parameters.query || 
                  task.originalInstruction.replace(/search|find|nodes?/gi, '').trim() ||
                  'http';
    
    const searchResult = await this.mcpBridge.searchNodes(query, {
      limit: task.parameters.limit || 10,
      includeAI: task.parameters.includeAI !== false
    });
    
    return {
      ...searchResult,
      taskType: 'mcp_node_search',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeMCPNodeInfo(task) {
    if (!this.mcpInitialized) {
      return {
        success: false,
        taskType: 'mcp_node_info',
        message: 'MCP Bridge not available. Please specify node type for basic info.',
        fallback: true
      };
    }

    const nodeType = task.parameters.nodeType || 
                     this.extractNodeTypeFromInstruction(task.originalInstruction);
    
    if (!nodeType) {
      return {
        success: false,
        taskType: 'mcp_node_info',
        message: 'Please specify which node you want information about',
        suggestion: 'Try: "Get info for HTTP Request node"'
      };
    }
    
    const nodeInfo = await this.mcpBridge.getNodeInfo(nodeType, {
      includeExamples: task.parameters.includeExamples !== false,
      includeDocumentation: task.parameters.includeDocumentation !== false
    });
    
    return {
      ...nodeInfo,
      taskType: 'mcp_node_info',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeMCPWorkflowValidation(task) {
    if (!this.mcpInitialized) {
      return {
        success: false,
        taskType: 'mcp_workflow_validation',
        message: 'MCP Bridge not available. Using basic workflow validation.',
        fallback: true
      };
    }

    const workflowId = task.parameters.workflowId || 
                       this.extractWorkflowIdFromInstruction(task.originalInstruction);
    
    if (!workflowId) {
      return {
        success: false,
        taskType: 'mcp_workflow_validation',
        message: 'Please specify which workflow to validate',
        suggestion: 'Try: "Validate workflow abc123"'
      };
    }

    // Get workflow from n8n first
    const workflowData = await this.api.getWorkflow(workflowId);
    if (!workflowData.success) {
      return {
        success: false,
        taskType: 'mcp_workflow_validation',
        message: `Could not retrieve workflow ${workflowId}`,
        error: workflowData.error
      };
    }

    const validation = await this.mcpBridge.validateWorkflow(workflowData.workflow, {
      strict: task.parameters.strict !== false,
      includePerformance: task.parameters.includePerformance !== false
    });
    
    return {
      ...validation,
      taskType: 'mcp_workflow_validation',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeMCPWorkflowGeneration(task) {
    if (!this.mcpInitialized) {
      return {
        success: false,
        taskType: 'mcp_workflow_generation',
        message: 'MCP Bridge not available. Cannot generate AI-powered workflows.',
        fallback: true
      };
    }

    const taskDescription = task.originalInstruction.replace(/generate|create|build|workflow/gi, '').trim();
    
    if (!taskDescription) {
      return {
        success: false,
        taskType: 'mcp_workflow_generation',
        message: 'Please describe what you want the workflow to do',
        suggestion: 'Try: "Generate workflow to send daily reports via email"'
      };
    }

    const generation = await this.mcpBridge.generateWorkflowSuggestions(taskDescription, {
      complexity: task.parameters.complexity || 'medium',
      includeErrorHandling: task.parameters.includeErrorHandling !== false,
      targetPlatform: task.parameters.targetPlatform || 'n8n'
    });
    
    return {
      ...generation,
      taskType: 'mcp_workflow_generation',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeMCPWorkflowEnhancement(task) {
    if (!this.mcpInitialized) {
      return {
        success: false,
        taskType: 'mcp_workflow_enhancement',
        message: 'MCP Bridge not available. Using basic enhancement suggestions.',
        fallback: true
      };
    }

    const workflowId = task.parameters.workflowId || 
                       this.extractWorkflowIdFromInstruction(task.originalInstruction);
    
    if (!workflowId) {
      return {
        success: false,
        taskType: 'mcp_workflow_enhancement',
        message: 'Please specify which workflow to enhance',
        suggestion: 'Try: "Enhance workflow abc123"'
      };
    }

    const enhancementType = task.parameters.enhancementType || 
                           this.extractEnhancementTypeFromInstruction(task.originalInstruction) ||
                           'optimize';

    const enhancement = await this.mcpBridge.enhanceWorkflow(workflowId, enhancementType);
    
    return {
      ...enhancement,
      taskType: 'mcp_workflow_enhancement',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  // Helper methods for MCP operations
  
  extractNodeTypeFromInstruction(instruction) {
    const nodePatterns = [
      /node[:\s]+([a-zA-Z0-9\-\.\_]+)/i,
      /(http|webhook|email|slack|google|database|function|if|switch|merge|split)/i,
      /([a-zA-Z0-9\-]+)\s+node/i
    ];
    
    for (const pattern of nodePatterns) {
      const match = instruction.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    
    return null;
  }

  extractWorkflowIdFromInstruction(instruction) {
    const patterns = [
      /workflow[:\s]+([a-zA-Z0-9]{16})/i,
      /([a-zA-Z0-9]{16})/i
    ];
    
    for (const pattern of patterns) {
      const match = instruction.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  extractEnhancementTypeFromInstruction(instruction) {
    const instruction_lower = instruction.toLowerCase();
    
    if (instruction_lower.includes('optimize') || instruction_lower.includes('performance')) {
      return 'optimize';
    }
    if (instruction_lower.includes('error') || instruction_lower.includes('handling')) {
      return 'error_handling';
    }
    if (instruction_lower.includes('monitor') || instruction_lower.includes('logging')) {
      return 'monitoring';
    }
    if (instruction_lower.includes('security') || instruction_lower.includes('secure')) {
      return 'security';
    }
    
    return 'optimize';
  }

  // Workflow Repository Execution Methods

  async executeWorkflowSearch(task) {
    if (!this.workflowRepoInitialized) {
      return {
        success: false,
        taskType: 'workflow_search',
        message: 'Workflow Repository not available. Cannot search reference workflows.',
        fallback: true
      };
    }

    const query = task.parameters.query || 
                  task.originalInstruction.replace(/search|find|workflows?|templates?/gi, '').trim();
    
    if (!query) {
      return {
        success: false,
        taskType: 'workflow_search',
        message: 'Please specify what type of workflows to search for',
        suggestion: 'Try: "Search for email notification workflows"'
      };
    }

    const searchResult = await this.workflowRepository.searchWorkflows(query, {
      limit: task.parameters.limit || 10,
      aiOnly: task.parameters.aiOnly,
      businessOnly: task.parameters.businessOnly,
      minQuality: task.parameters.minQuality || 80
    });

    return {
      ...searchResult,
      taskType: 'workflow_search',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeWorkflowRecommendations(task) {
    if (!this.workflowRepoInitialized) {
      return {
        success: false,
        taskType: 'workflow_recommendations',
        message: 'Workflow Repository not available. Cannot provide workflow recommendations.',
        fallback: true
      };
    }

    const taskDescription = task.originalInstruction
      .replace(/workflow|recommendations?|suggest|recommend|for|task/gi, '')
      .trim();
    
    if (!taskDescription) {
      return {
        success: false,
        taskType: 'workflow_recommendations',
        message: 'Please describe what task you need workflow recommendations for',
        suggestion: 'Try: "Recommend workflows for sending daily reports"'
      };
    }

    const recommendations = await this.workflowRepository.getWorkflowRecommendations(taskDescription, {
      count: task.parameters.count || 5,
      includeAI: task.parameters.includeAI !== false,
      includeBusiness: task.parameters.includeBusiness !== false
    });

    return {
      ...recommendations,
      taskType: 'workflow_recommendations',
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async executeReferenceBasedGeneration(task) {
    if (!this.workflowRepoInitialized) {
      return {
        success: false,
        taskType: 'reference_based_generation',
        message: 'Workflow Repository not available. Cannot generate workflows from references.',
        fallback: true
      };
    }

    const instruction = task.originalInstruction;
    let referenceQuery, newTaskDescription;

    // Extract reference and new task from instruction
    if (instruction.includes('based on') || instruction.includes('like')) {
      const parts = instruction.split(/based on|like/i);
      if (parts.length >= 2) {
        newTaskDescription = parts[0].replace(/create|generate|workflow|build/gi, '').trim();
        referenceQuery = parts[1].trim();
      }
    } else if (instruction.includes('using')) {
      const parts = instruction.split(/using/i);
      if (parts.length >= 2) {
        newTaskDescription = parts[0].replace(/create|generate|workflow|build/gi, '').trim();
        referenceQuery = parts[1].replace(/template|workflow|as reference/gi, '').trim();
      }
    }

    if (!referenceQuery || !newTaskDescription) {
      return {
        success: false,
        taskType: 'reference_based_generation',
        message: 'Please specify both the reference workflow and new task',
        suggestion: 'Try: "Create workflow for data backup based on email notification workflow"'
      };
    }

    // Search for reference workflows
    const searchResult = await this.workflowRepository.searchWorkflows(referenceQuery, {
      limit: 3,
      minQuality: 85
    });

    if (!searchResult.success || searchResult.results.length === 0) {
      return {
        success: false,
        taskType: 'reference_based_generation',
        message: `Could not find reference workflows for: "${referenceQuery}"`,
        suggestion: 'Try searching with different keywords or check available workflow templates'
      };
    }

    // Generate new workflow based on reference
    const referenceWorkflow = searchResult.results[0];
    const generatedWorkflow = await this.generateWorkflowFromReference(
      referenceWorkflow,
      newTaskDescription,
      task.parameters
    );

    return {
      success: true,
      taskType: 'reference_based_generation',
      referenceWorkflow: referenceWorkflow,
      generatedWorkflow: generatedWorkflow,
      task: newTaskDescription,
      referenceQuery: referenceQuery,
      executedAt: new Date().toISOString(),
      parameters: task.parameters
    };
  }

  async generateWorkflowFromReference(referenceWorkflow, newTask, options = {}) {
    // This is where we combine MCP and reference workflow to generate new workflow
    const enhancedGeneration = {
      name: `${newTask} (Based on ${referenceWorkflow.name})`,
      description: `AI-generated workflow for ${newTask}, using ${referenceWorkflow.name} as reference`,
      reference: {
        source: referenceWorkflow.source,
        original: referenceWorkflow.name,
        quality: referenceWorkflow.quality,
        nodeCount: referenceWorkflow.nodeCount
      },
      nodes: this.adaptNodesForNewTask(referenceWorkflow, newTask),
      connections: this.adaptConnectionsForNewTask(referenceWorkflow, newTask),
      metadata: {
        generatedAt: new Date().toISOString(),
        generationMethod: 'reference-based',
        confidence: this.calculateGenerationConfidence(referenceWorkflow, newTask),
        customizations: this.suggestCustomizations(referenceWorkflow, newTask)
      }
    };

    return enhancedGeneration;
  }

  adaptNodesForNewTask(referenceWorkflow, newTask) {
    // Mock implementation - in production this would intelligently adapt nodes
    const baseNodes = referenceWorkflow.nodes || [];
    return baseNodes.map(node => ({
      ...node,
      name: node.name.replace(/reference|original/gi, 'adapted'),
      adapted: true,
      adaptationReason: `Modified for task: ${newTask}`
    }));
  }

  adaptConnectionsForNewTask(referenceWorkflow, newTask) {
    // Mock implementation - adapt connections based on new task requirements
    return referenceWorkflow.connections || {};
  }

  calculateGenerationConfidence(referenceWorkflow, newTask) {
    // Calculate confidence based on reference quality and task similarity
    const baseConfidence = referenceWorkflow.quality || 70;
    const taskRelevance = this.calculateTaskRelevance(referenceWorkflow, newTask);
    
    return Math.min(95, baseConfidence + (taskRelevance * 0.1));
  }

  suggestCustomizations(referenceWorkflow, newTask) {
    return [
      'Update node parameters based on your specific requirements',
      'Configure credentials for any new services',
      'Test the workflow thoroughly before production use',
      'Consider adding error handling if not present',
      'Customize trigger conditions for your use case'
    ];
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
        const workflowIssues = result.issues || 0;
        const suggestions = result.suggestions || 0;
        const optimizations = result.optimizations || 0;
        return `⚡ Workflow "${workflowName}" analysis: ${workflowIssues} issues, ${suggestions} suggestions, ${optimizations} optimizations available.`;

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