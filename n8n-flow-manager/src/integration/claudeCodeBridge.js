import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ClaudeCodeBridge {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.commandMap = new Map();
    this.contextData = new Map();
    this.executionHistory = [];
    this.setupCommandMap();
  }

  setupCommandMap() {
    // Map natural language patterns to n8n flow manager commands
    this.commandMap.set('analyze', {
      commands: ['analyze', 'analyze --detailed', 'health'],
      description: 'Analyze system health and identify issues',
      patterns: [
        'analyze the system',
        'check system health',
        'what issues exist',
        'scan for problems',
        'health check',
        'system analysis',
        'code quality check'
      ]
    });

    this.commandMap.set('improve', {
      commands: ['improve --dry-run', 'improve --apply', 'quick-fix'],
      description: 'Apply automated improvements to fix issues',
      patterns: [
        'fix issues',
        'apply improvements',
        'improve code',
        'fix problems automatically',
        'make improvements',
        'enhance system',
        'auto-fix'
      ]
    });

    this.commandMap.set('upgrade', {
      commands: ['plan-upgrade', 'plan-upgrade --detailed'],
      description: 'Create strategic upgrade path',
      patterns: [
        'plan upgrade',
        'create upgrade path',
        'strategic planning',
        'roadmap',
        'upgrade strategy',
        'improvement plan'
      ]
    });

    this.commandMap.set('export', {
      commands: ['export --all', 'export --workflow'],
      description: 'Export workflows from n8n',
      patterns: [
        'export workflows',
        'save workflows',
        'backup workflows',
        'download flows',
        'extract workflows'
      ]
    });

    this.commandMap.set('import', {
      commands: ['import', 'import --update --backup'],
      description: 'Import workflows to n8n',
      patterns: [
        'import workflow',
        'upload workflow',
        'restore workflow',
        'deploy workflow',
        'load workflow'
      ]
    });

    this.commandMap.set('test', {
      commands: ['test --workflow', 'test --all'],
      description: 'Test workflows for functionality and performance',
      patterns: [
        'test workflow',
        'validate workflow',
        'check workflow',
        'run tests',
        'verify workflow'
      ]
    });

    this.commandMap.set('status', {
      commands: ['status', 'list', 'list --active'],
      description: 'Check workflow and system status',
      patterns: [
        'show status',
        'list workflows',
        'workflow status',
        'check git status',
        'current state'
      ]
    });

    this.commandMap.set('connection', {
      commands: ['test-connection'],
      description: 'Test connection to n8n instance',
      patterns: [
        'test connection',
        'check n8n connection',
        'verify connection',
        'connection status'
      ]
    });
  }

  async executeClaudeCodeRequest(request, options = {}) {
    const { 
      autoApprove = false, 
      dryRun = false, 
      priority = 'medium',
      context = {} 
    } = options;

    try {
      // Parse the request to understand intent
      const intent = this.parseIntent(request);
      
      // Store context for future reference
      this.storeContext(request, context);
      
      // Route to appropriate handler
      const result = await this.routeRequest(intent, options);
      
      // Log execution
      this.logExecution(request, intent, result);
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestion: 'Please check the request format and try again',
        availableCommands: Array.from(this.commandMap.keys())
      };
    }
  }

  parseIntent(request) {
    const lowerRequest = request.toLowerCase();
    let bestMatch = null;
    let highestScore = 0;

    // Check each command pattern
    for (const [command, config] of this.commandMap.entries()) {
      for (const pattern of config.patterns) {
        const score = this.calculateSimilarity(lowerRequest, pattern);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = {
            command,
            config,
            score,
            matchedPattern: pattern
          };
        }
      }
    }

    // Extract parameters from request
    const parameters = this.extractParameters(lowerRequest, bestMatch);

    return {
      ...bestMatch,
      parameters,
      originalRequest: request,
      confidence: highestScore
    };
  }

  calculateSimilarity(text, pattern) {
    const textWords = text.split(/\s+/);
    const patternWords = pattern.split(/\s+/);
    
    let matches = 0;
    for (const word of patternWords) {
      if (textWords.some(textWord => 
        textWord.includes(word) || word.includes(textWord) ||
        this.areSynonyms(textWord, word)
      )) {
        matches++;
      }
    }
    
    // Also check for direct substring matches
    if (text.includes(pattern)) {
      matches += patternWords.length;
    }
    
    return matches / patternWords.length;
  }

  areSynonyms(word1, word2) {
    const synonymGroups = [
      ['analyze', 'check', 'scan', 'examine', 'inspect'],
      ['fix', 'repair', 'improve', 'enhance', 'optimize'],
      ['test', 'validate', 'verify', 'check'],
      ['export', 'save', 'backup', 'download'],
      ['import', 'upload', 'restore', 'load'],
      ['workflow', 'flow', 'process', 'automation'],
      ['status', 'state', 'condition', 'health']
    ];

    return synonymGroups.some(group => 
      group.includes(word1.toLowerCase()) && group.includes(word2.toLowerCase())
    );
  }

  extractParameters(request, intent) {
    const parameters = {};
    
    // Extract workflow IDs
    const workflowIdMatch = request.match(/workflow[:\s]+([a-zA-Z0-9-_]+)/i);
    if (workflowIdMatch) {
      parameters.workflowId = workflowIdMatch[1];
    }

    // Extract file paths
    const filePathMatch = request.match(/file[:\s]+([^\s]+\.json)/i);
    if (filePathMatch) {
      parameters.filePath = filePathMatch[1];
    }

    // Extract priority levels
    const priorityMatch = request.match(/priority[:\s]+(immediate|critical|high|medium|low)/i);
    if (priorityMatch) {
      parameters.priority = priorityMatch[1].toLowerCase();
    }

    // Extract action modifiers
    if (request.includes('dry run') || request.includes('preview') || request.includes('show me what')) {
      parameters.dryRun = true;
    }

    if (request.includes('apply') || request.includes('execute') || request.includes('do it')) {
      parameters.apply = true;
    }

    if (request.includes('all workflows') || request.includes('every workflow')) {
      parameters.all = true;
    }

    if (request.includes('detailed') || request.includes('comprehensive') || request.includes('full')) {
      parameters.detailed = true;
    }

    return parameters;
  }

  async routeRequest(intent, options) {
    if (!intent || intent.confidence < 0.3) {
      return this.handleUnknownRequest(intent);
    }

    const { command, parameters } = intent;
    
    switch (command) {
      case 'analyze':
        return await this.handleAnalyzeRequest(parameters, options);
      case 'improve':
        return await this.handleImproveRequest(parameters, options);
      case 'upgrade':
        return await this.handleUpgradeRequest(parameters, options);
      case 'export':
        return await this.handleExportRequest(parameters, options);
      case 'import':
        return await this.handleImportRequest(parameters, options);
      case 'test':
        return await this.handleTestRequest(parameters, options);
      case 'status':
        return await this.handleStatusRequest(parameters, options);
      case 'connection':
        return await this.handleConnectionRequest(parameters, options);
      default:
        return this.handleUnknownRequest(intent);
    }
  }

  async handleAnalyzeRequest(parameters, options) {
    const commands = [];
    
    if (parameters.detailed) {
      commands.push('analyze --detailed');
    } else {
      commands.push('analyze');
      commands.push('health');
    }

    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'system_analysis',
      commands: commands,
      results: results,
      summary: this.summarizeAnalysisResults(results),
      suggestions: this.generateSuggestions(results, 'analysis')
    };
  }

  async handleImproveRequest(parameters, options) {
    const commands = [];
    const priority = parameters.priority || options.priority || 'high';
    
    if (parameters.dryRun && !parameters.apply) {
      commands.push(`improve --dry-run --priority ${priority}`);
    } else if (parameters.apply) {
      if (priority === 'immediate' || priority === 'critical') {
        commands.push('quick-fix');
      } else {
        commands.push(`improve --apply --priority ${priority}`);
      }
    } else {
      // Default to dry run for safety
      commands.push(`improve --dry-run --priority ${priority}`);
    }

    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'system_improvement',
      commands: commands,
      results: results,
      summary: this.summarizeImprovementResults(results),
      suggestions: this.generateSuggestions(results, 'improvement')
    };
  }

  async handleUpgradeRequest(parameters, options) {
    const commands = ['plan-upgrade'];
    
    if (parameters.detailed) {
      commands[0] += ' --json';
    }

    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'upgrade_planning',
      commands: commands,
      results: results,
      summary: this.summarizeUpgradeResults(results),
      suggestions: this.generateSuggestions(results, 'upgrade')
    };
  }

  async handleExportRequest(parameters, options) {
    const commands = [];
    
    if (parameters.workflowId) {
      commands.push(`export --workflow ${parameters.workflowId}`);
    } else if (parameters.all) {
      commands.push('export --all');
    } else {
      commands.push('export --all'); // Default to all
    }

    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'workflow_export',
      commands: commands,
      results: results,
      summary: this.summarizeExportResults(results),
      suggestions: this.generateSuggestions(results, 'export')
    };
  }

  async handleImportRequest(parameters, options) {
    const commands = [];
    
    if (parameters.filePath) {
      let command = `import ${parameters.filePath}`;
      if (parameters.update || !parameters.new) {
        command += ' --update --backup';
      }
      commands.push(command);
    } else {
      return {
        success: false,
        error: 'File path required for import',
        suggestion: 'Please specify the workflow file path to import'
      };
    }

    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'workflow_import',
      commands: commands,
      results: results,
      summary: this.summarizeImportResults(results),
      suggestions: this.generateSuggestions(results, 'import')
    };
  }

  async handleTestRequest(parameters, options) {
    const commands = [];
    
    if (parameters.workflowId) {
      commands.push(`test --workflow ${parameters.workflowId}`);
    } else if (parameters.filePath) {
      commands.push(`test --file ${parameters.filePath}`);
    } else if (parameters.all) {
      commands.push('test --all');
    } else {
      commands.push('list --active'); // Show available workflows for testing
    }

    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'workflow_testing',
      commands: commands,
      results: results,
      summary: this.summarizeTestResults(results),
      suggestions: this.generateSuggestions(results, 'test')
    };
  }

  async handleStatusRequest(parameters, options) {
    const commands = ['status', 'list'];
    
    if (parameters.detailed) {
      commands.push('health');
    }

    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'status_check',
      commands: commands,
      results: results,
      summary: this.summarizeStatusResults(results),
      suggestions: this.generateSuggestions(results, 'status')
    };
  }

  async handleConnectionRequest(parameters, options) {
    const commands = ['test-connection'];
    const results = await this.executeCommands(commands);
    
    return {
      success: true,
      action: 'connection_test',
      commands: commands,
      results: results,
      summary: this.summarizeConnectionResults(results),
      suggestions: this.generateSuggestions(results, 'connection')
    };
  }

  handleUnknownRequest(intent) {
    const availableCommands = Array.from(this.commandMap.keys());
    const suggestions = [];
    
    if (intent && intent.confidence > 0.1) {
      suggestions.push(`Did you mean: ${intent.command}?`);
      suggestions.push(`Try: ${intent.config?.description}`);
    }
    
    suggestions.push('Available actions: ' + availableCommands.join(', '));
    
    return {
      success: false,
      error: 'Could not understand the request',
      confidence: intent?.confidence || 0,
      suggestions: suggestions,
      availableCommands: availableCommands,
      examples: [
        'analyze the system',
        'fix all issues',
        'export all workflows',
        'test workflow abc123',
        'create upgrade plan'
      ]
    };
  }

  async executeCommands(commands) {
    const results = [];
    
    for (const command of commands) {
      try {
        console.log(`Executing: npm start ${command}`);
        
        const result = await execAsync(`npm start ${command}`, {
          cwd: this.projectRoot,
          timeout: 300000, // 5 minutes timeout
          maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        results.push({
          command: command,
          success: true,
          stdout: result.stdout,
          stderr: result.stderr,
          executedAt: new Date().toISOString()
        });
        
      } catch (error) {
        results.push({
          command: command,
          success: false,
          error: error.message,
          stdout: error.stdout || '',
          stderr: error.stderr || '',
          executedAt: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  // Summary methods for different result types
  summarizeAnalysisResults(results) {
    // Parse analysis output and create summary
    const summary = { type: 'analysis', findings: [] };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        // Extract key information from stdout
        const output = result.stdout;
        
        if (output.includes('Critical:')) {
          const criticalMatch = output.match(/Critical:\s*(\d+)/);
          if (criticalMatch) {
            summary.criticalIssues = parseInt(criticalMatch[1]);
          }
        }
        
        if (output.includes('Overall Rating:')) {
          const ratingMatch = output.match(/Overall Rating:\s*([^\n]+)/);
          if (ratingMatch) {
            summary.overallRating = ratingMatch[1].trim();
          }
        }
        
        if (output.includes('Total Issues:')) {
          const issuesMatch = output.match(/Total Issues.*?(\d+)/);
          if (issuesMatch) {
            summary.totalIssues = parseInt(issuesMatch[1]);
          }
        }
      }
    });
    
    return summary;
  }

  summarizeImprovementResults(results) {
    const summary = { type: 'improvement', changes: [] };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        const output = result.stdout;
        
        if (output.includes('Completed:')) {
          const completedMatch = output.match(/Completed:\s*(\d+)/);
          if (completedMatch) {
            summary.completedTasks = parseInt(completedMatch[1]);
          }
        }
        
        if (output.includes('Failed:')) {
          const failedMatch = output.match(/Failed:\s*(\d+)/);
          if (failedMatch) {
            summary.failedTasks = parseInt(failedMatch[1]);
          }
        }
        
        if (output.includes('dry run') || output.includes('Dry Run')) {
          summary.isDryRun = true;
        }
      }
    });
    
    return summary;
  }

  summarizeUpgradeResults(results) {
    const summary = { type: 'upgrade', phases: [] };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        const output = result.stdout;
        
        if (output.includes('phases')) {
          const phasesMatch = output.match(/(\d+)\s*phases/);
          if (phasesMatch) {
            summary.totalPhases = parseInt(phasesMatch[1]);
          }
        }
        
        if (output.includes('weeks')) {
          const weeksMatch = output.match(/(\d+)\s*weeks?/);
          if (weeksMatch) {
            summary.estimatedWeeks = parseInt(weeksMatch[1]);
          }
        }
      }
    });
    
    return summary;
  }

  summarizeExportResults(results) {
    const summary = { type: 'export', exported: [] };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        const output = result.stdout;
        
        if (output.includes('Exported')) {
          const exportedMatch = output.match(/Exported\s*(\d+)/);
          if (exportedMatch) {
            summary.exportedCount = parseInt(exportedMatch[1]);
          }
        }
      }
    });
    
    return summary;
  }

  summarizeImportResults(results) {
    const summary = { type: 'import', imported: [] };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        const output = result.stdout;
        
        if (output.includes('Import successful')) {
          summary.success = true;
        }
        
        if (output.includes('Workflow:')) {
          const workflowMatch = output.match(/Workflow:\s*([^\n]+)/);
          if (workflowMatch) {
            summary.workflowName = workflowMatch[1].trim();
          }
        }
      }
    });
    
    return summary;
  }

  summarizeTestResults(results) {
    const summary = { type: 'test', results: [] };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        const output = result.stdout;
        
        if (output.includes('Test passed')) {
          summary.testsPassed = (summary.testsPassed || 0) + 1;
        }
        
        if (output.includes('Test failed')) {
          summary.testsFailed = (summary.testsFailed || 0) + 1;
        }
      }
    });
    
    return summary;
  }

  summarizeStatusResults(results) {
    const summary = { type: 'status', info: {} };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        const output = result.stdout;
        
        if (output.includes('workflows')) {
          const workflowsMatch = output.match(/Found\s*(\d+)\s*workflows/);
          if (workflowsMatch) {
            summary.totalWorkflows = parseInt(workflowsMatch[1]);
          }
        }
        
        if (output.includes('Current branch:')) {
          const branchMatch = output.match(/Current branch:\s*([^\n]+)/);
          if (branchMatch) {
            summary.currentBranch = branchMatch[1].trim();
          }
        }
      }
    });
    
    return summary;
  }

  summarizeConnectionResults(results) {
    const summary = { type: 'connection', status: 'unknown' };
    
    results.forEach(result => {
      if (result.success && result.stdout) {
        const output = result.stdout;
        
        if (output.includes('Connection successful')) {
          summary.status = 'connected';
        } else if (output.includes('Connection failed')) {
          summary.status = 'failed';
        }
      }
    });
    
    return summary;
  }

  generateSuggestions(results, actionType) {
    const suggestions = [];
    
    switch (actionType) {
      case 'analysis':
        suggestions.push('Review critical issues first');
        suggestions.push('Use "improve" command to fix issues automatically');
        suggestions.push('Create upgrade plan with "plan-upgrade"');
        break;
        
      case 'improvement':
        suggestions.push('Verify improvements with "analyze" command');
        suggestions.push('Test workflows after improvements');
        suggestions.push('Commit changes to version control');
        break;
        
      case 'upgrade':
        suggestions.push('Start with Phase 1 (Critical Issues)');
        suggestions.push('Use automated improvements where possible');
        suggestions.push('Set up project tracking for manual tasks');
        break;
        
      case 'export':
        suggestions.push('Workflows exported and version controlled');
        suggestions.push('Consider testing exported workflows');
        suggestions.push('Review git status for changes');
        break;
        
      case 'import':
        suggestions.push('Test imported workflow functionality');
        suggestions.push('Verify workflow configuration');
        suggestions.push('Check n8n dashboard for successful import');
        break;
        
      case 'test':
        suggestions.push('Fix any failing tests before deployment');
        suggestions.push('Consider adding more test scenarios');
        suggestions.push('Review test performance metrics');
        break;
        
      case 'status':
        suggestions.push('Address any pending changes');
        suggestions.push('Keep workflows organized and documented');
        suggestions.push('Regular health checks recommended');
        break;
        
      case 'connection':
        if (results.some(r => r.stdout?.includes('failed'))) {
          suggestions.push('Check n8n server status and configuration');
          suggestions.push('Verify API credentials in .env file');
          suggestions.push('Ensure n8n is accessible at configured URL');
        } else {
          suggestions.push('Connection healthy - ready for workflow management');
        }
        break;
    }
    
    return suggestions;
  }

  storeContext(request, context) {
    const contextKey = Date.now().toString();
    this.contextData.set(contextKey, {
      request,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 context entries
    if (this.contextData.size > 100) {
      const firstKey = this.contextData.keys().next().value;
      this.contextData.delete(firstKey);
    }
  }

  logExecution(request, intent, result) {
    this.executionHistory.push({
      request,
      intent: intent ? {
        command: intent.command,
        confidence: intent.confidence,
        parameters: intent.parameters
      } : null,
      result: {
        success: result.success,
        action: result.action,
        commandCount: result.commands?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 executions
    if (this.executionHistory.length > 1000) {
      this.executionHistory.shift();
    }
  }

  getExecutionHistory(limit = 10) {
    return this.executionHistory.slice(-limit);
  }

  getAvailableCommands() {
    const commands = {};
    for (const [key, config] of this.commandMap.entries()) {
      commands[key] = {
        description: config.description,
        patterns: config.patterns,
        availableCommands: config.commands
      };
    }
    return commands;
  }

  async getSystemStatus() {
    try {
      const healthResult = await this.executeCommands(['health']);
      return {
        success: true,
        status: 'operational',
        lastCheck: new Date().toISOString(),
        healthResult: healthResult[0]
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        error: error.message,
        lastCheck: new Date().toISOString()
      };
    }
  }
}