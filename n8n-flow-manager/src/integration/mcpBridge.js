/**
 * n8n-MCP Bridge Integration
 * Connects n8n Flow Manager with n8n-MCP for AI-enhanced workflow management
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/config.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_PATH = path.join(__dirname, '../../n8n-mcp');

export class MCPBridge {
  constructor() {
    this.mcpProcess = null;
    this.isConnected = false;
    this.capabilities = null;
    this.nodeDatabase = null;
  }

  /**
   * Initialize MCP Bridge with n8n Flow Manager
   */
  async initialize() {
    try {
      logger.info('🤖 Initializing n8n-MCP Bridge...');
      
      // Check if n8n-MCP is available
      const mcpAvailable = await this.checkMCPAvailability();
      if (!mcpAvailable) {
        logger.warn('n8n-MCP not available, skipping MCP integration');
        return { success: false, message: 'n8n-MCP not installed' };
      }

      // Load MCP capabilities
      await this.loadMCPCapabilities();
      
      this.isConnected = true;
      logger.info('✅ n8n-MCP Bridge initialized successfully');
      
      return {
        success: true,
        message: 'MCP Bridge initialized',
        capabilities: this.capabilities
      };
      
    } catch (error) {
      logger.error('Failed to initialize MCP Bridge:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Check if n8n-MCP is available and functional
   */
  async checkMCPAvailability() {
    try {
      // Check if n8n-mcp directory exists and has package.json
      const fs = await import('fs/promises');
      const mcpPackagePath = path.join(MCP_PATH, 'package.json');
      
      await fs.access(mcpPackagePath);
      const packageData = JSON.parse(await fs.readFile(mcpPackagePath, 'utf8'));
      
      logger.info(`Found n8n-MCP v${packageData.version}`);
      return true;
      
    } catch (error) {
      logger.warn('n8n-MCP not found or not accessible');
      return false;
    }
  }

  /**
   * Load MCP capabilities and node information
   */
  async loadMCPCapabilities() {
    this.capabilities = {
      nodeCount: 535,
      nodePropertyCoverage: '99%',
      nodeOperationCoverage: '63.6%',
      documentationCoverage: '90%',
      aiCapableNodes: 263,
      tools: [
        'search_nodes',
        'get_node_info',
        'get_node_essentials',
        'validate_node_minimal',
        'validate_workflow',
        'n8n_create_workflow',
        'n8n_get_workflow',
        'n8n_update_workflow',
        'n8n_list_workflows',
        'n8n_validate_workflow'
      ],
      features: [
        'AI-assisted workflow design',
        'Node property validation',
        'Workflow structure validation',
        'Template generation',
        'Smart configuration suggestions',
        'Error analysis and recovery'
      ]
    };
  }

  /**
   * Search for n8n nodes using MCP
   */
  async searchNodes(query, options = {}) {
    if (!this.isConnected) {
      throw new Error('MCP Bridge not initialized');
    }

    try {
      // Use lightweight node search without spawning full MCP process
      const searchResults = await this.executeNodeSearch(query, options);
      
      return {
        success: true,
        results: searchResults,
        query: query,
        options: options
      };
      
    } catch (error) {
      logger.error('Node search failed:', error);
      return {
        success: false,
        error: error.message,
        query: query
      };
    }
  }

  /**
   * Get detailed node information
   */
  async getNodeInfo(nodeType, options = {}) {
    if (!this.isConnected) {
      throw new Error('MCP Bridge not initialized');
    }

    try {
      const nodeInfo = await this.executeGetNodeInfo(nodeType, options);
      
      return {
        success: true,
        nodeType: nodeType,
        nodeInfo: nodeInfo,
        enhanced: true
      };
      
    } catch (error) {
      logger.error(`Failed to get node info for ${nodeType}:`, error);
      return {
        success: false,
        error: error.message,
        nodeType: nodeType
      };
    }
  }

  /**
   * Validate workflow using MCP
   */
  async validateWorkflow(workflow, options = {}) {
    if (!this.isConnected) {
      throw new Error('MCP Bridge not initialized');
    }

    try {
      const validation = await this.executeWorkflowValidation(workflow, options);
      
      return {
        success: true,
        workflow: workflow.name || 'Unknown',
        validation: validation,
        enhanced: true
      };
      
    } catch (error) {
      logger.error('Workflow validation failed:', error);
      return {
        success: false,
        error: error.message,
        workflow: workflow.name || 'Unknown'
      };
    }
  }

  /**
   * Generate AI-enhanced workflow suggestions
   */
  async generateWorkflowSuggestions(task, context = {}) {
    if (!this.isConnected) {
      throw new Error('MCP Bridge not initialized');
    }

    try {
      const suggestions = await this.executeWorkflowGeneration(task, context);
      
      return {
        success: true,
        task: task,
        suggestions: suggestions,
        context: context
      };
      
    } catch (error) {
      logger.error('Workflow generation failed:', error);
      return {
        success: false,
        error: error.message,
        task: task
      };
    }
  }

  /**
   * Enhance existing workflow with AI suggestions
   */
  async enhanceWorkflow(workflowId, enhancementType = 'optimize') {
    if (!this.isConnected) {
      throw new Error('MCP Bridge not initialized');
    }

    try {
      logger.info(`🔧 Enhancing workflow ${workflowId} with type: ${enhancementType}`);
      
      const enhancements = await this.executeWorkflowEnhancement(workflowId, enhancementType);
      
      return {
        success: true,
        workflowId: workflowId,
        enhancementType: enhancementType,
        enhancements: enhancements,
        applied: false // Safety: don't auto-apply
      };
      
    } catch (error) {
      logger.error('Workflow enhancement failed:', error);
      return {
        success: false,
        error: error.message,
        workflowId: workflowId
      };
    }
  }

  /**
   * Get MCP status and statistics
   */
  getStatus() {
    return {
      connected: this.isConnected,
      capabilities: this.capabilities,
      mcpPath: MCP_PATH,
      features: this.capabilities?.features || [],
      tools: this.capabilities?.tools || [],
      lastCheck: new Date().toISOString()
    };
  }

  // Internal execution methods (lightweight implementations)

  async executeNodeSearch(query, options) {
    // Mock implementation - in production this would query MCP database
    const mockResults = [
      {
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        description: 'Makes HTTP requests to any URL',
        category: 'Core',
        aiCapable: true,
        properties: ['url', 'method', 'headers', 'body'],
        operations: ['get', 'post', 'put', 'delete']
      },
      {
        name: 'Google Sheets',
        type: 'n8n-nodes-base.googleSheets',
        description: 'Read and write data to Google Sheets',
        category: 'Productivity',
        aiCapable: true,
        properties: ['documentId', 'sheetName', 'range'],
        operations: ['append', 'read', 'update', 'delete']
      }
    ].filter(node => 
      node.name.toLowerCase().includes(query.toLowerCase()) ||
      node.description.toLowerCase().includes(query.toLowerCase())
    );

    return {
      nodes: mockResults,
      total: mockResults.length,
      query: query,
      executionTime: '15ms'
    };
  }

  async executeGetNodeInfo(nodeType, options) {
    // Mock implementation
    return {
      type: nodeType,
      displayName: nodeType.split('.').pop(),
      description: `Detailed information for ${nodeType}`,
      properties: {
        // Mock properties
        required: ['url'],
        optional: ['headers', 'authentication', 'timeout'],
        advanced: ['ssl', 'proxy', 'redirect']
      },
      operations: ['execute', 'test'],
      examples: [
        {
          name: 'Basic Usage',
          description: `Basic example of ${nodeType}`,
          configuration: {}
        }
      ],
      aiEnhanced: true
    };
  }

  async executeWorkflowValidation(workflow, options) {
    // Mock validation
    return {
      valid: true,
      warnings: [],
      errors: [],
      suggestions: [
        'Consider adding error handling nodes',
        'Add timeout configuration for HTTP requests',
        'Use environment variables for sensitive data'
      ],
      performance: {
        estimatedExecutionTime: '2-5 seconds',
        complexity: 'Medium',
        resourceUsage: 'Low'
      },
      aiAnalysis: {
        optimizationLevel: 85,
        errorProneness: 'Low',
        maintainability: 'High'
      }
    };
  }

  async executeWorkflowGeneration(task, context) {
    // Mock workflow generation
    return {
      workflows: [
        {
          name: `AI Generated: ${task}`,
          description: `Automatically generated workflow for: ${task}`,
          nodes: [
            {
              type: 'n8n-nodes-base.start',
              name: 'Start',
              position: [100, 100]
            },
            {
              type: 'n8n-nodes-base.httpRequest',
              name: 'HTTP Request',
              position: [300, 100]
            }
          ],
          connections: {},
          confidence: 0.85,
          aiGenerated: true
        }
      ],
      alternatives: [],
      reasoning: `Generated workflow based on task: ${task}`,
      estimatedComplexity: 'Medium'
    };
  }

  async executeWorkflowEnhancement(workflowId, enhancementType) {
    // Mock enhancement suggestions
    return {
      suggestions: [
        {
          type: 'optimization',
          description: 'Add parallel processing for better performance',
          impact: 'High',
          difficulty: 'Medium',
          changes: ['Add SplitInBatches node', 'Configure parallel execution']
        },
        {
          type: 'error_handling',
          description: 'Add comprehensive error handling',
          impact: 'High',
          difficulty: 'Low',
          changes: ['Add Try/Catch blocks', 'Configure error notifications']
        },
        {
          type: 'monitoring',
          description: 'Add execution monitoring and logging',
          impact: 'Medium',
          difficulty: 'Low',
          changes: ['Add logging nodes', 'Configure metrics collection']
        }
      ],
      riskLevel: 'Low',
      estimatedImprovements: {
        performance: '+25%',
        reliability: '+40%',
        maintainability: '+30%'
      }
    };
  }

  /**
   * Cleanup MCP resources
   */
  async cleanup() {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
    
    this.isConnected = false;
    logger.info('🔌 MCP Bridge disconnected');
  }
}

// Export singleton instance
export const mcpBridge = new MCPBridge();