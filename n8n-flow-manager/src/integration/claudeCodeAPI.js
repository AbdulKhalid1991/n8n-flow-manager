import { ClaudeCodeBridge } from './claudeCodeBridge.js';
import { FlowManager } from '../core/flowManager.js';
import { FlowTester } from '../testing/flowTester.js';
import { FlowEnhancer } from '../enhancement/flowEnhancer.js';
import { EnhancementAgent } from '../agents/enhancementAgent.js';
import { ImprovementExecutor } from '../agents/improvementExecutor.js';
import { UpgradePathPlanner } from '../agents/upgradePathPlanner.js';
import { N8nClient } from '../api/n8nClient.js';

export class ClaudeCodeAPI {
  constructor() {
    this.bridge = new ClaudeCodeBridge();
    this.flowManager = new FlowManager();
    this.flowTester = new FlowTester();
    this.flowEnhancer = new FlowEnhancer();
    this.enhancementAgent = new EnhancementAgent();
    this.improvementExecutor = new ImprovementExecutor();
    this.upgradePathPlanner = new UpgradePathPlanner();
    this.n8nClient = new N8nClient();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return true;
    
    try {
      await this.flowManager.initialize();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize n8n Flow Manager API:', error);
      return false;
    }
  }

  // Main entry point for Claude Code integration
  async handleClaudeCodeRequest(instruction, context = {}) {
    await this.initialize();
    
    try {
      // Use the bridge to interpret and execute the request
      const result = await this.bridge.executeClaudeCodeRequest(instruction, {
        autoApprove: context.autoApprove || false,
        dryRun: context.dryRun,
        priority: context.priority || 'medium',
        context: context
      });

      return {
        success: result.success,
        data: result,
        message: this.formatResponseMessage(result),
        suggestions: result.suggestions || [],
        nextSteps: this.generateNextSteps(result)
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to process n8n flow manager request',
        suggestions: [
          'Check if n8n Flow Manager is properly configured',
          'Verify the instruction format',
          'Try a simpler command first'
        ]
      };
    }
  }

  // Direct API methods that Claude Code can call
  async analyzeSystem(options = {}) {
    await this.initialize();
    
    try {
      const analysis = await this.enhancementAgent.analyzeProject();
      
      return {
        success: true,
        analysis: analysis,
        summary: {
          overallRating: analysis.summary?.overallRating || 'Unknown',
          totalIssues: analysis.summary?.totalIssues || 0,
          criticalIssues: analysis.summary?.severityBreakdown?.critical || 0,
          highIssues: analysis.summary?.severityBreakdown?.high || 0,
          estimatedEffort: analysis.summary?.estimatedEffort || 'Unknown'
        },
        recommendations: analysis.recommendations?.slice(0, 3) || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async improveSystem(options = {}) {
    await this.initialize();
    
    const { dryRun = true, priority = 'high', autoApply = false } = options;
    
    try {
      const result = await this.improvementExecutor.executeImprovements({
        dryRun,
        priority,
        autoApply
      });
      
      return {
        success: result.success,
        improvements: result,
        applied: !dryRun && result.completedTasks?.length > 0,
        tasksCompleted: result.completedTasks?.length || 0,
        tasksFailed: result.failedTasks?.length || 0,
        tasksSkipped: result.skippedTasks?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createUpgradePlan(options = {}) {
    await this.initialize();
    
    try {
      const upgradePlan = await this.upgradePathPlanner.createUpgradePath(options);
      
      return {
        success: upgradePlan.success,
        upgradePath: upgradePlan,
        phases: upgradePlan.upgradePath?.phases?.length || 0,
        estimatedWeeks: upgradePlan.estimatedTimeline?.totalWeeks || 0,
        riskLevel: upgradePlan.riskAssessment?.riskLevel || 'unknown'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportWorkflows(options = {}) {
    await this.initialize();
    
    try {
      if (options.workflowId) {
        const result = await this.flowManager.exportWorkflow(options.workflowId, options);
        return {
          success: result.success,
          exported: result.success ? 1 : 0,
          filePath: result.filePath,
          message: result.message
        };
      } else {
        const result = await this.flowManager.exportAllWorkflows(options);
        return {
          success: result.success,
          exported: result.results?.filter(r => r.success).length || 0,
          failed: result.results?.filter(r => !r.success).length || 0,
          message: result.message
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async importWorkflow(filePath, options = {}) {
    await this.initialize();
    
    try {
      const result = await this.flowManager.importWorkflow(filePath, options);
      return {
        success: result.success,
        workflow: result.workflow,
        message: result.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async testWorkflow(workflowId, testData = {}) {
    await this.initialize();
    
    try {
      const result = await this.flowTester.testWorkflow(workflowId, testData);
      return {
        success: result.success,
        testResult: result,
        duration: result.duration,
        status: result.status,
        errors: result.errors || [],
        warnings: result.warnings || []
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getWorkflowList(options = {}) {
    await this.initialize();
    
    try {
      const workflows = await this.n8nClient.getAllWorkflows();
      
      let filteredWorkflows = workflows;
      if (options.active === true) {
        filteredWorkflows = workflows.filter(w => w.active);
      } else if (options.active === false) {
        filteredWorkflows = workflows.filter(w => !w.active);
      }
      
      return {
        success: true,
        workflows: filteredWorkflows,
        total: filteredWorkflows.length,
        active: workflows.filter(w => w.active).length,
        inactive: workflows.filter(w => !w.active).length
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSystemStatus() {
    await this.initialize();
    
    try {
      // Test n8n connection
      const connectionTest = await this.n8nClient.testConnection();
      
      // Get git status
      const gitStatus = await this.flowManager.gitManager.getStatus();
      
      // Quick health check
      const healthAnalysis = await this.enhancementAgent.analyzeProject();
      
      return {
        success: true,
        status: {
          n8nConnection: connectionTest.success ? 'connected' : 'failed',
          connectionMessage: connectionTest.message,
          gitBranch: gitStatus.current,
          modifiedFiles: gitStatus.modified?.length || 0,
          overallHealth: healthAnalysis.summary?.overallRating || 'Unknown',
          criticalIssues: healthAnalysis.summary?.severityBreakdown?.critical || 0,
          lastCheck: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: {
          n8nConnection: 'error',
          overallHealth: 'Unknown',
          lastCheck: new Date().toISOString()
        }
      };
    }
  }

  async enhanceWorkflow(workflowId, options = {}) {
    await this.initialize();
    
    try {
      const workflow = await this.n8nClient.getWorkflow(workflowId);
      const analysis = this.flowEnhancer.analyzeWorkflow(workflow);
      
      return {
        success: true,
        workflowId: workflowId,
        workflowName: workflow.name,
        analysis: analysis,
        issues: analysis.issues?.length || 0,
        suggestions: analysis.suggestions?.length || 0,
        optimizations: analysis.optimizations?.length || 0,
        securityRecommendations: analysis.securityRecommendations?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async compareWorkflows(localFilePath, workflowId) {
    await this.initialize();
    
    try {
      const comparison = await this.flowManager.compareWorkflows(localFilePath, workflowId);
      
      return {
        success: true,
        comparison: comparison,
        differences: comparison.differences?.length || 0,
        hasChanges: comparison.differences && comparison.differences.length > 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getExecutionHistory(limit = 10) {
    return {
      success: true,
      history: this.bridge.getExecutionHistory(limit)
    };
  }

  async getAvailableCommands() {
    return {
      success: true,
      commands: this.bridge.getAvailableCommands()
    };
  }

  // Helper methods
  formatResponseMessage(result) {
    if (!result.success) {
      return result.error || 'Operation failed';
    }

    switch (result.action) {
      case 'system_analysis':
        const analysisMsg = `System analysis complete. `;
        if (result.summary?.criticalIssues > 0) {
          return analysisMsg + `Found ${result.summary.criticalIssues} critical issues requiring immediate attention.`;
        } else if (result.summary?.totalIssues > 0) {
          return analysisMsg + `Found ${result.summary.totalIssues} issues. Overall rating: ${result.summary.overallRating}.`;
        } else {
          return analysisMsg + `System is in good condition.`;
        }

      case 'system_improvement':
        if (result.summary?.isDryRun) {
          const tasks = result.summary?.completedTasks || 0;
          return `Improvement analysis complete. ${tasks} automated improvements available.`;
        } else {
          const completed = result.summary?.completedTasks || 0;
          const failed = result.summary?.failedTasks || 0;
          return `System improvements applied. ${completed} tasks completed${failed > 0 ? `, ${failed} failed` : ''}.`;
        }

      case 'upgrade_planning':
        const phases = result.summary?.totalPhases || 0;
        const weeks = result.summary?.estimatedWeeks || 0;
        return `Upgrade plan created with ${phases} phases, estimated ${weeks} weeks timeline.`;

      case 'workflow_export':
        const exported = result.summary?.exportedCount || 0;
        return `Successfully exported ${exported} workflow${exported !== 1 ? 's' : ''}.`;

      case 'workflow_import':
        return result.summary?.success ? 
          `Workflow "${result.summary?.workflowName}" imported successfully.` :
          'Workflow import failed.';

      case 'workflow_testing':
        const passed = result.summary?.testsPassed || 0;
        const failed = result.summary?.testsFailed || 0;
        return `Testing complete. ${passed} passed${failed > 0 ? `, ${failed} failed` : ''}.`;

      case 'status_check':
        const workflows = result.summary?.totalWorkflows || 0;
        const branch = result.summary?.currentBranch || 'unknown';
        return `Status check complete. ${workflows} workflows found, current branch: ${branch}.`;

      case 'connection_test':
        return result.summary?.status === 'connected' ? 
          'n8n connection successful.' : 
          'n8n connection failed. Check configuration.';

      default:
        return 'Operation completed successfully.';
    }
  }

  generateNextSteps(result) {
    const steps = [];

    if (!result.success) {
      steps.push('Review error message and check system configuration');
      steps.push('Try a simpler operation to verify system status');
      return steps;
    }

    switch (result.action) {
      case 'system_analysis':
        if (result.summary?.criticalIssues > 0) {
          steps.push('Address critical issues immediately');
          steps.push('Use automated improvements: improve --apply --priority immediate');
        } else if (result.summary?.totalIssues > 0) {
          steps.push('Review detailed analysis results');
          steps.push('Apply automated improvements for common issues');
        }
        steps.push('Create upgrade plan for strategic improvements');
        break;

      case 'system_improvement':
        if (result.summary?.isDryRun) {
          steps.push('Review proposed improvements');
          steps.push('Apply improvements with --apply flag');
        } else {
          steps.push('Verify improvements with system analysis');
          steps.push('Test affected workflows');
          steps.push('Commit changes to version control');
        }
        break;

      case 'upgrade_planning':
        steps.push('Review upgrade phases and timeline');
        steps.push('Start with Phase 1 (Critical Issues)');
        steps.push('Set up project tracking for manual tasks');
        break;

      case 'workflow_export':
        steps.push('Review exported workflow files');
        steps.push('Check git status for version control');
        steps.push('Consider testing exported workflows');
        break;

      case 'workflow_import':
        if (result.summary?.success) {
          steps.push('Verify workflow in n8n dashboard');
          steps.push('Test workflow functionality');
        } else {
          steps.push('Check workflow file format and content');
          steps.push('Review import error messages');
        }
        break;

      case 'workflow_testing':
        if (result.summary?.testsFailed > 0) {
          steps.push('Review failing test details');
          steps.push('Fix workflow issues before deployment');
        } else {
          steps.push('Workflow testing passed - ready for deployment');
        }
        break;

      case 'connection_test':
        if (result.summary?.status !== 'connected') {
          steps.push('Check n8n server status');
          steps.push('Verify configuration in .env file');
          steps.push('Test network connectivity');
        }
        break;
    }

    return steps;
  }
}

// Export singleton instance
export const claudeCodeAPI = new ClaudeCodeAPI();