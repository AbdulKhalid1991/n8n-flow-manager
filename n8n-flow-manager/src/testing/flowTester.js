import { N8nClient } from '../api/n8nClient.js';
import { config } from '../config/config.js';

export class FlowTester {
  constructor() {
    this.n8nClient = new N8nClient();
    this.testResults = [];
    this.timeout = config.testing.timeout;
  }

  async testWorkflow(workflowId, testData = {}) {
    const startTime = Date.now();
    const testResult = {
      workflowId,
      testName: testData.name || `Test-${workflowId}`,
      status: 'running',
      startTime,
      endTime: null,
      duration: null,
      success: false,
      errors: [],
      warnings: [],
      executionId: null,
      output: null
    };

    try {
      // Pre-test validation
      const workflow = await this.n8nClient.getWorkflow(workflowId);
      const validationResult = this.validateWorkflow(workflow);
      
      if (!validationResult.valid) {
        testResult.errors = validationResult.errors;
        testResult.status = 'failed';
        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - startTime;
        return testResult;
      }

      // Execute workflow
      const execution = await this.n8nClient.executeWorkflow(workflowId, testData.input || {});
      testResult.executionId = execution.id;
      
      // Wait for execution to complete
      const executionResult = await this.waitForExecution(execution.id);
      testResult.output = executionResult;
      
      // Validate results
      const resultValidation = this.validateExecutionResult(executionResult, testData.expectedOutput);
      testResult.success = resultValidation.valid;
      testResult.errors = resultValidation.errors;
      testResult.warnings = resultValidation.warnings;
      
      testResult.status = testResult.success ? 'passed' : 'failed';
      
    } catch (error) {
      testResult.errors.push({
        type: 'execution_error',
        message: error.message,
        stack: error.stack
      });
      testResult.status = 'failed';
    } finally {
      testResult.endTime = Date.now();
      testResult.duration = testResult.endTime - startTime;
    }

    this.testResults.push(testResult);
    return testResult;
  }

  async testMultipleWorkflows(workflowTests, options = {}) {
    const parallelLimit = options.parallelLimit || config.testing.parallelLimit;
    const results = [];
    
    // Process workflows in batches to respect parallel limit
    for (let i = 0; i < workflowTests.length; i += parallelLimit) {
      const batch = workflowTests.slice(i, i + parallelLimit);
      const batchPromises = batch.map(test => 
        this.testWorkflow(test.workflowId, test.testData)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(r => r.value || r.reason));
    }
    
    return this.generateTestReport(results);
  }

  validateWorkflow(workflow) {
    const errors = [];
    const warnings = [];
    
    // Check if workflow has nodes
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push({ type: 'structure', message: 'Workflow has no nodes' });
    }
    
    // Check for trigger nodes
    const triggerNodes = workflow.nodes.filter(node => 
      node.type && (node.type.includes('trigger') || node.type.includes('webhook'))
    );
    
    if (triggerNodes.length === 0) {
      warnings.push({ type: 'structure', message: 'No trigger nodes found' });
    }
    
    // Check for disconnected nodes
    const connectedNodes = new Set();
    if (workflow.connections) {
      Object.values(workflow.connections).forEach(nodeConnections => {
        Object.values(nodeConnections).forEach(outputs => {
          outputs.forEach(output => {
            if (output.node) connectedNodes.add(output.node);
          });
        });
      });
    }
    
    const disconnectedNodes = workflow.nodes.filter(node => 
      !connectedNodes.has(node.name) && !node.type.includes('trigger')
    );
    
    if (disconnectedNodes.length > 0) {
      warnings.push({
        type: 'connectivity',
        message: `Found ${disconnectedNodes.length} disconnected nodes`,
        nodes: disconnectedNodes.map(n => n.name)
      });
    }
    
    // Check for missing credentials
    const nodesNeedingCredentials = workflow.nodes.filter(node => 
      node.credentials && Object.keys(node.credentials).length > 0
    );
    
    if (nodesNeedingCredentials.length > 0) {
      warnings.push({
        type: 'credentials',
        message: 'Some nodes may require credentials',
        nodes: nodesNeedingCredentials.map(n => n.name)
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateExecutionResult(executionResult, expectedOutput) {
    const errors = [];
    const warnings = [];
    
    // Check execution status
    if (executionResult.status === 'error') {
      errors.push({
        type: 'execution_error',
        message: executionResult.error || 'Execution failed'
      });
    }
    
    // Validate expected output if provided
    if (expectedOutput) {
      if (expectedOutput.status && executionResult.status !== expectedOutput.status) {
        errors.push({
          type: 'output_validation',
          message: `Expected status '${expectedOutput.status}' but got '${executionResult.status}'`
        });
      }
      
      if (expectedOutput.data) {
        const outputValidation = this.compareOutputData(executionResult.data, expectedOutput.data);
        if (!outputValidation.match) {
          errors.push({
            type: 'data_validation',
            message: 'Output data does not match expected result',
            details: outputValidation.differences
          });
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  compareOutputData(actual, expected) {
    // Simple comparison - can be enhanced for deep object comparison
    try {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      
      return {
        match: actualStr === expectedStr,
        differences: actualStr !== expectedStr ? {
          actual: actual,
          expected: expected
        } : null
      };
    } catch (error) {
      return {
        match: false,
        differences: { error: 'Failed to compare output data' }
      };
    }
  }

  async waitForExecution(executionId, maxWaitTime = this.timeout) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const executions = await this.n8nClient.getExecutions(null, { id: executionId });
        const execution = executions.find(e => e.id === executionId);
        
        if (execution && ['success', 'error'].includes(execution.status)) {
          return execution;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      } catch (error) {
        throw new Error(`Failed to check execution status: ${error.message}`);
      }
    }
    
    throw new Error(`Execution ${executionId} timed out after ${maxWaitTime}ms`);
  }

  generateTestReport(testResults) {
    const totalTests = testResults.length;
    const passedTests = testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = testResults.reduce((sum, r) => sum + (r.duration || 0), 0);
    
    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests * 100).toFixed(2) : 0,
        totalDuration,
        averageDuration: totalTests > 0 ? (totalDuration / totalTests).toFixed(0) : 0
      },
      details: testResults,
      timestamp: new Date().toISOString()
    };
  }

  getTestHistory() {
    return this.testResults;
  }

  clearTestHistory() {
    this.testResults = [];
  }
}