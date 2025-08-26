import { config } from '../config/config.js';

export class FlowEnhancer {
  constructor() {
    this.enhancementLevel = config.enhancement.level;
    this.autoOptimize = config.enhancement.autoOptimize;
  }

  analyzeWorkflow(workflow) {
    const analysis = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      nodeCount: workflow.nodes?.length || 0,
      connectionCount: this.countConnections(workflow.connections),
      issues: [],
      suggestions: [],
      optimizations: [],
      securityRecommendations: [],
      performanceMetrics: {}
    };

    // Analyze nodes
    this.analyzeNodes(workflow, analysis);
    
    // Analyze connections
    this.analyzeConnections(workflow, analysis);
    
    // Check for best practices
    this.checkBestPractices(workflow, analysis);
    
    // Performance analysis
    this.analyzePerformance(workflow, analysis);
    
    // Security analysis
    this.analyzeSecurityIssues(workflow, analysis);
    
    // Generate optimization suggestions
    this.generateOptimizations(workflow, analysis);
    
    return analysis;
  }

  analyzeNodes(workflow, analysis) {
    if (!workflow.nodes) return;

    const nodeTypes = {};
    const duplicateNodes = [];
    const misconfiguredNodes = [];

    workflow.nodes.forEach(node => {
      // Count node types
      nodeTypes[node.type] = (nodeTypes[node.type] || 0) + 1;
      
      // Check for potential duplicates
      const similarNodes = workflow.nodes.filter(n => 
        n.type === node.type && 
        n.name !== node.name &&
        JSON.stringify(n.parameters) === JSON.stringify(node.parameters)
      );
      
      if (similarNodes.length > 0) {
        duplicateNodes.push({
          node: node.name,
          type: node.type,
          duplicates: similarNodes.map(n => n.name)
        });
      }
      
      // Check for common misconfigurations
      const nodeIssues = this.checkNodeConfiguration(node);
      if (nodeIssues.length > 0) {
        misconfiguredNodes.push({
          node: node.name,
          issues: nodeIssues
        });
      }
    });

    analysis.performanceMetrics.nodeTypes = nodeTypes;
    
    if (duplicateNodes.length > 0) {
      analysis.issues.push({
        type: 'duplicate_nodes',
        severity: 'medium',
        message: `Found ${duplicateNodes.length} potential duplicate nodes`,
        details: duplicateNodes
      });
    }
    
    if (misconfiguredNodes.length > 0) {
      analysis.issues.push({
        type: 'node_configuration',
        severity: 'high',
        message: `Found ${misconfiguredNodes.length} misconfigured nodes`,
        details: misconfiguredNodes
      });
    }
  }

  analyzeConnections(workflow, analysis) {
    if (!workflow.connections) return;

    const connectionIssues = [];
    const unusedOutputs = [];
    
    // Check for complex branching patterns
    Object.entries(workflow.connections).forEach(([nodeName, connections]) => {
      Object.entries(connections).forEach(([outputIndex, outputs]) => {
        if (outputs.length > 3) {
          connectionIssues.push({
            node: nodeName,
            issue: 'complex_branching',
            outputCount: outputs.length,
            message: 'Node has many output connections, consider simplifying'
          });
        }
        
        // Check for unused outputs
        if (outputs.length === 0) {
          unusedOutputs.push({
            node: nodeName,
            output: outputIndex
          });
        }
      });
    });
    
    if (connectionIssues.length > 0) {
      analysis.issues.push({
        type: 'connection_complexity',
        severity: 'medium',
        message: 'Complex connection patterns detected',
        details: connectionIssues
      });
    }
    
    if (unusedOutputs.length > 0) {
      analysis.suggestions.push({
        type: 'cleanup',
        message: 'Remove unused node outputs',
        details: unusedOutputs
      });
    }
  }

  checkBestPractices(workflow, analysis) {
    const bestPracticeIssues = [];
    
    // Check for error handling
    const hasErrorHandling = workflow.nodes.some(node => 
      node.type && node.type.includes('error')
    );
    
    if (!hasErrorHandling) {
      bestPracticeIssues.push({
        type: 'error_handling',
        message: 'No error handling nodes found',
        recommendation: 'Add error handling to improve workflow reliability'
      });
    }
    
    // Check for logging/monitoring
    const hasLogging = workflow.nodes.some(node => 
      node.type && (node.type.includes('log') || node.type.includes('webhook'))
    );
    
    if (!hasLogging) {
      bestPracticeIssues.push({
        type: 'monitoring',
        message: 'No logging or monitoring nodes found',
        recommendation: 'Add logging for better debugging and monitoring'
      });
    }
    
    // Check workflow naming
    if (!workflow.name || workflow.name.includes('Untitled') || workflow.name.includes('Copy')) {
      bestPracticeIssues.push({
        type: 'naming',
        message: 'Workflow has generic or unclear name',
        recommendation: 'Use descriptive workflow names'
      });
    }
    
    // Check for documentation (notes)
    const hasDocumentation = workflow.nodes.some(node => 
      node.notes && node.notes.trim().length > 0
    );
    
    if (!hasDocumentation && workflow.nodes.length > 5) {
      bestPracticeIssues.push({
        type: 'documentation',
        message: 'Large workflow lacks documentation',
        recommendation: 'Add notes to complex nodes for better maintainability'
      });
    }
    
    if (bestPracticeIssues.length > 0) {
      analysis.suggestions.push({
        type: 'best_practices',
        message: 'Best practice improvements available',
        details: bestPracticeIssues
      });
    }
  }

  analyzePerformance(workflow, analysis) {
    const performanceIssues = [];
    
    // Check for potential performance bottlenecks
    if (workflow.nodes) {
      const heavyNodes = workflow.nodes.filter(node => 
        node.type && (
          node.type.includes('database') ||
          node.type.includes('http') ||
          node.type.includes('api')
        )
      );
      
      if (heavyNodes.length > 5) {
        performanceIssues.push({
          type: 'heavy_operations',
          message: `Workflow has ${heavyNodes.length} potentially heavy operations`,
          recommendation: 'Consider batching operations or adding delays'
        });
      }
    }
    
    // Check for sequential vs parallel execution opportunities
    const sequentialChains = this.findSequentialChains(workflow);
    if (sequentialChains.length > 3) {
      performanceIssues.push({
        type: 'parallelization',
        message: 'Long sequential chains detected',
        recommendation: 'Consider parallelizing independent operations'
      });
    }
    
    if (performanceIssues.length > 0) {
      analysis.suggestions.push({
        type: 'performance',
        message: 'Performance optimization opportunities',
        details: performanceIssues
      });
    }
  }

  analyzeSecurityIssues(workflow, analysis) {
    const securityIssues = [];
    
    if (workflow.nodes) {
      workflow.nodes.forEach(node => {
        // Check for hardcoded credentials or sensitive data
        if (node.parameters) {
          const sensitiveFields = this.findSensitiveData(node.parameters);
          if (sensitiveFields.length > 0) {
            securityIssues.push({
              node: node.name,
              type: 'hardcoded_secrets',
              message: 'Potential hardcoded sensitive data detected',
              fields: sensitiveFields
            });
          }
        }
        
        // Check for insecure HTTP usage
        if (node.type && node.type.includes('http') && 
            node.parameters && node.parameters.url && 
            node.parameters.url.startsWith('http://')) {
          securityIssues.push({
            node: node.name,
            type: 'insecure_connection',
            message: 'Using insecure HTTP instead of HTTPS',
            recommendation: 'Use HTTPS for secure connections'
          });
        }
      });
    }
    
    if (securityIssues.length > 0) {
      analysis.securityRecommendations.push({
        type: 'security_issues',
        severity: 'high',
        message: 'Security issues detected',
        details: securityIssues
      });
    }
  }

  generateOptimizations(workflow, analysis) {
    const optimizations = [];
    
    // Suggest node consolidation
    if (analysis.issues.some(i => i.type === 'duplicate_nodes')) {
      optimizations.push({
        type: 'consolidate_nodes',
        description: 'Merge duplicate or similar nodes',
        impact: 'Reduces complexity and maintenance overhead',
        effort: 'low'
      });
    }
    
    // Suggest error handling improvements
    if (analysis.suggestions.some(s => s.details?.some(d => d.type === 'error_handling'))) {
      optimizations.push({
        type: 'add_error_handling',
        description: 'Implement comprehensive error handling',
        impact: 'Improves reliability and debugging capabilities',
        effort: 'medium'
      });
    }
    
    // Suggest performance improvements
    if (analysis.suggestions.some(s => s.type === 'performance')) {
      optimizations.push({
        type: 'performance_optimization',
        description: 'Optimize execution flow and reduce bottlenecks',
        impact: 'Faster execution and better resource utilization',
        effort: 'medium'
      });
    }
    
    analysis.optimizations = optimizations;
  }

  checkNodeConfiguration(node) {
    const issues = [];
    
    // Check for empty required parameters
    if (node.parameters) {
      Object.entries(node.parameters).forEach(([key, value]) => {
        if ((value === '' || value === null || value === undefined) && 
            this.isRequiredParameter(node.type, key)) {
          issues.push({
            parameter: key,
            issue: 'empty_required_parameter',
            message: `Required parameter '${key}' is empty`
          });
        }
      });
    }
    
    return issues;
  }

  findSensitiveData(parameters) {
    const sensitiveFields = [];
    const sensitiveKeywords = ['password', 'secret', 'key', 'token', 'credential'];
    
    Object.entries(parameters).forEach(([key, value]) => {
      const keyLower = key.toLowerCase();
      if (sensitiveKeywords.some(keyword => keyLower.includes(keyword))) {
        if (typeof value === 'string' && value.length > 0 && !value.startsWith('{{')) {
          sensitiveFields.push(key);
        }
      }
    });
    
    return sensitiveFields;
  }

  findSequentialChains(workflow) {
    // Simplified implementation - can be enhanced
    const chains = [];
    if (!workflow.connections) return chains;
    
    // This would analyze the workflow structure to find long sequential chains
    // Implementation details would depend on specific requirements
    
    return chains;
  }

  countConnections(connections) {
    if (!connections) return 0;
    
    return Object.values(connections).reduce((total, nodeConnections) => {
      return total + Object.values(nodeConnections).reduce((nodeTotal, outputs) => {
        return nodeTotal + (Array.isArray(outputs) ? outputs.length : 0);
      }, 0);
    }, 0);
  }

  isRequiredParameter(nodeType, parameterName) {
    // This would contain knowledge about which parameters are required for different node types
    // For now, return false as a safe default
    return false;
  }

  applyOptimization(workflow, optimizationType) {
    // This would contain the logic to actually apply optimizations to workflows
    // Implementation would depend on the specific optimization type
    const optimizedWorkflow = { ...workflow };
    
    switch (optimizationType) {
      case 'consolidate_nodes':
        // Logic to consolidate duplicate nodes
        break;
      case 'add_error_handling':
        // Logic to add error handling nodes
        break;
      case 'performance_optimization':
        // Logic to optimize performance
        break;
      default:
        console.log(`Optimization type '${optimizationType}' not implemented`);
    }
    
    return optimizedWorkflow;
  }
}