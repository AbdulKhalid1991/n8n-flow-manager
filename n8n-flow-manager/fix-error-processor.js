import https from 'https';
import { config } from 'dotenv';

config();

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function fixErrorProcessor() {
  console.log('🔧 Fixing Advanced Error Processor in Error Logger Enhanced v2...');
  
  try {
    // Get current workflow
    const workflow = await getCurrentWorkflow();
    
    // Find and fix the Advanced Error Processor node
    const processorNode = workflow.nodes.find(node => node.name === 'Advanced Error Processor');
    
    if (!processorNode) {
      throw new Error('Advanced Error Processor node not found');
    }
    
    console.log('✅ Found Advanced Error Processor node');
    
    // Fixed function code with proper error handling
    processorNode.parameters.functionCode = `
// 🔧 FIXED: Advanced Error Analysis & Processing
const inputData = $input.first();
const execution = $execution;
const workflow = $workflow;

console.log('Input data received:', JSON.stringify(inputData, null, 2));

// Enhanced error categorization with null safety
function categorizeError(errorInput) {
  // Handle different error input formats
  let errorMessage = '';
  
  if (typeof errorInput === 'string') {
    errorMessage = errorInput.toLowerCase();
  } else if (errorInput && errorInput.message) {
    errorMessage = errorInput.message.toLowerCase();
  } else if (errorInput && errorInput.error && errorInput.error.message) {
    errorMessage = errorInput.error.message.toLowerCase();
  } else if (errorInput && errorInput.description) {
    errorMessage = errorInput.description.toLowerCase();
  } else {
    errorMessage = 'unknown error occurred';
  }
  
  console.log('Processing error message:', errorMessage);
  
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout') || errorMessage.includes('econnreset')) {
    return { category: 'NETWORK', severity: 'HIGH', recoverable: true };
  } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden') || errorMessage.includes('401') || errorMessage.includes('403')) {
    return { category: 'AUTH', severity: 'CRITICAL', recoverable: false };
  } else if (errorMessage.includes('database') || errorMessage.includes('sql') || errorMessage.includes('db') || errorMessage.includes('mysql') || errorMessage.includes('postgres')) {
    return { category: 'DATABASE', severity: 'HIGH', recoverable: true };
  } else if (errorMessage.includes('api') || errorMessage.includes('request') || errorMessage.includes('response') || errorMessage.includes('http') || errorMessage.includes('rest')) {
    return { category: 'API', severity: 'MEDIUM', recoverable: true };
  } else if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('format') || errorMessage.includes('schema')) {
    return { category: 'VALIDATION', severity: 'LOW', recoverable: true };
  } else if (errorMessage.includes('memory') || errorMessage.includes('heap') || errorMessage.includes('out of') || errorMessage.includes('limit')) {
    return { category: 'RESOURCE', severity: 'CRITICAL', recoverable: false };
  }
  return { category: 'GENERAL', severity: 'MEDIUM', recoverable: true };
}

// Generate unique error ID
const errorId = \`ERR-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;

// Extract error information safely
let errorData = {};
if (inputData && inputData.error) {
  errorData = inputData.error;
} else if (inputData && inputData.message) {
  errorData = { message: inputData.message };
} else {
  errorData = inputData || { message: 'Unknown error' };
}

// Enhanced error analysis
const errorAnalysis = categorizeError(errorData);

// Create comprehensive error report
const errorReport = {
  errorId: errorId,
  timestamp: new Date().toISOString(),
  
  // Basic error info with safe access
  message: errorData.message || errorData.description || 'Unknown error',
  stack: errorData.stack || 'No stack trace available',
  type: errorData.constructor?.name || errorData.name || 'Error',
  
  // Enhanced categorization
  category: errorAnalysis.category,
  severity: errorAnalysis.severity,
  recoverable: errorAnalysis.recoverable,
  
  // Execution context
  workflowId: workflow.id,
  workflowName: workflow.name,
  executionId: execution.id,
  nodeId: inputData.node?.id || 'unknown',
  nodeName: inputData.node?.name || 'Unknown Node',
  nodeType: inputData.node?.type || 'unknown',
  
  // Enhanced metrics
  errorCount: 1,
  firstOccurrence: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'production',
  
  // Recovery suggestions
  recoverySuggestions: generateRecoverySuggestions(errorAnalysis),
  
  // Alert routing
  requiresImmediate: errorAnalysis.severity === 'CRITICAL',
  notificationChannels: determineNotificationChannels(errorAnalysis),
  
  // Debug information
  debugInfo: {
    inputDataType: typeof inputData,
    inputDataKeys: inputData ? Object.keys(inputData) : [],
    processingTime: new Date().toISOString()
  }
};

function generateRecoverySuggestions(analysis) {
  const suggestions = [];
  
  switch(analysis.category) {
    case 'NETWORK':
      suggestions.push('Check network connectivity');
      suggestions.push('Verify external service status');
      suggestions.push('Consider retry with exponential backoff');
      suggestions.push('Check firewall and proxy settings');
      break;
    case 'AUTH':
      suggestions.push('Verify API credentials and tokens');
      suggestions.push('Check token expiration and refresh');
      suggestions.push('Review access permissions and scopes');
      suggestions.push('Validate authentication configuration');
      break;
    case 'DATABASE':
      suggestions.push('Check database connection and availability');
      suggestions.push('Verify query syntax and parameters');
      suggestions.push('Monitor database performance and locks');
      suggestions.push('Check database user permissions');
      break;
    case 'API':
      suggestions.push('Validate API endpoint and version');
      suggestions.push('Check request format and headers');
      suggestions.push('Review rate limiting and quotas');
      suggestions.push('Verify API service status');
      break;
    case 'VALIDATION':
      suggestions.push('Review input data format and schema');
      suggestions.push('Check required fields and data types');
      suggestions.push('Validate business rules and constraints');
      suggestions.push('Review data transformation logic');
      break;
    case 'RESOURCE':
      suggestions.push('Monitor memory usage and optimization');
      suggestions.push('Check system resources and limits');
      suggestions.push('Review data processing batch sizes');
      suggestions.push('Consider scaling or optimization');
      break;
    default:
      suggestions.push('Review error logs and context');
      suggestions.push('Check system resources and health');
      suggestions.push('Verify configuration and setup');
      suggestions.push('Consider contacting technical support');
  }
  
  return suggestions;
}

function determineNotificationChannels(analysis) {
  const channels = ['sheets', 'telegram'];
  
  if (analysis.severity === 'CRITICAL') {
    channels.push('email', 'webhook');
  } else if (analysis.severity === 'HIGH') {
    channels.push('webhook');
  }
  
  return channels;
}

console.log('Error report generated:', JSON.stringify(errorReport, null, 2));

return [errorReport];
`;
    
    console.log('🔧 Updated Advanced Error Processor with enhanced error handling');
    
    // Update the workflow
    await updateWorkflow(workflow);
    
    console.log('✅ Advanced Error Processor successfully updated!');
    console.log('🔧 Fixed Issues:');
    console.log('   ✅ Added null safety for error.message');
    console.log('   ✅ Enhanced error data extraction');
    console.log('   ✅ Added multiple error format support');
    console.log('   ✅ Improved debugging information');
    console.log('   ✅ Added comprehensive logging');
    console.log('');
    console.log('🎯 Error Logger Enhanced v2 is now production-ready!');
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

function getCurrentWorkflow() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'n8n.srv779128.hstgr.cloud',
      path: '/api/v1/workflows/gTcn8f7892yrUPRn',
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Accept': 'application/json'
      },
      agent: agent
    };

    https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject).end();
  });
}

function updateWorkflow(workflow) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(workflow);
    
    const options = {
      hostname: 'n8n.srv779128.hstgr.cloud',
      path: '/api/v1/workflows/gTcn8f7892yrUPRn',
      method: 'PUT',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      agent: agent
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Run the fix
fixErrorProcessor();