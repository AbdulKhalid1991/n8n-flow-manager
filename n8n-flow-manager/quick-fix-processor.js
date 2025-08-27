import https from 'https';
import { config } from 'dotenv';

config();

const agent = new https.Agent({
  rejectUnauthorized: false
});

// Fixed function code with proper error handling
const fixedFunctionCode = `
// 🔧 FIXED: Advanced Error Analysis & Processing
const inputData = $input.first();
const execution = $execution;
const workflow = $workflow;

console.log('Input data received:', JSON.stringify(inputData, null, 2));

// Enhanced error categorization with null safety
function categorizeError(errorInput) {
  // Handle different error input formats
  let errorMessage = '';
  
  try {
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
  } catch (e) {
    console.log('Error extracting message:', e);
    errorMessage = 'error processing error message';
  }
  
  console.log('Processing error message:', errorMessage);
  
  if (errorMessage.includes('network') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return { category: 'NETWORK', severity: 'HIGH', recoverable: true };
  } else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized') || errorMessage.includes('forbidden')) {
    return { category: 'AUTH', severity: 'CRITICAL', recoverable: false };
  } else if (errorMessage.includes('database') || errorMessage.includes('sql') || errorMessage.includes('db')) {
    return { category: 'DATABASE', severity: 'HIGH', recoverable: true };
  } else if (errorMessage.includes('api') || errorMessage.includes('request') || errorMessage.includes('response')) {
    return { category: 'API', severity: 'MEDIUM', recoverable: true };
  } else if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('format')) {
    return { category: 'VALIDATION', severity: 'LOW', recoverable: true };
  } else if (errorMessage.includes('memory') || errorMessage.includes('heap') || errorMessage.includes('out of')) {
    return { category: 'RESOURCE', severity: 'CRITICAL', recoverable: false };
  }
  return { category: 'GENERAL', severity: 'MEDIUM', recoverable: true };
}

// Generate unique error ID
const errorId = \`ERR-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;

// Extract error information safely
let errorData = {};
try {
  if (inputData && inputData.error) {
    errorData = inputData.error;
  } else if (inputData && inputData.message) {
    errorData = { message: inputData.message };
  } else if (typeof inputData === 'string') {
    errorData = { message: inputData };
  } else {
    errorData = inputData || { message: 'Unknown error' };
  }
} catch (e) {
  console.log('Error extracting error data:', e);
  errorData = { message: 'Error processing input data' };
}

// Enhanced error analysis
const errorAnalysis = categorizeError(errorData);

// Create comprehensive error report
const errorReport = {
  errorId: errorId,
  timestamp: new Date().toISOString(),
  
  // Basic error info with safe access
  message: (errorData && errorData.message) || (errorData && errorData.description) || 'Unknown error',
  stack: (errorData && errorData.stack) || 'No stack trace available',
  type: 'Error',
  
  // Enhanced categorization
  category: errorAnalysis.category,
  severity: errorAnalysis.severity,
  recoverable: errorAnalysis.recoverable,
  
  // Execution context
  workflowId: workflow.id,
  workflowName: workflow.name,
  executionId: execution.id,
  nodeId: 'unknown',
  nodeName: 'Unknown Node',
  nodeType: 'unknown',
  
  // Enhanced metrics
  errorCount: 1,
  firstOccurrence: new Date().toISOString(),
  environment: 'production',
  
  // Recovery suggestions
  recoverySuggestions: generateRecoverySuggestions(errorAnalysis),
  
  // Alert routing
  requiresImmediate: errorAnalysis.severity === 'CRITICAL',
  notificationChannels: determineNotificationChannels(errorAnalysis)
};

function generateRecoverySuggestions(analysis) {
  const suggestions = [];
  
  switch(analysis.category) {
    case 'NETWORK':
      suggestions.push('Check network connectivity');
      suggestions.push('Verify external service status');
      suggestions.push('Consider retry with backoff');
      break;
    case 'AUTH':
      suggestions.push('Verify API credentials');
      suggestions.push('Check token expiration');
      suggestions.push('Review access permissions');
      break;
    case 'DATABASE':
      suggestions.push('Check database connection');
      suggestions.push('Verify query syntax');
      suggestions.push('Monitor database performance');
      break;
    case 'API':
      suggestions.push('Validate API endpoint');
      suggestions.push('Check request format');
      suggestions.push('Review rate limiting');
      break;
    default:
      suggestions.push('Review error logs');
      suggestions.push('Check system resources');
  }
  
  return suggestions;
}

function determineNotificationChannels(analysis) {
  const channels = ['sheets', 'telegram'];
  
  if (analysis.severity === 'CRITICAL') {
    channels.push('email', 'webhook');
  }
  
  return channels;
}

console.log('Error report generated successfully');

return [errorReport];
`;

async function quickFixProcessor() {
  console.log('🔧 Quick Fix: Advanced Error Processor');
  
  try {
    // Create minimal workflow update with only the function code change
    const minimalUpdate = {
      nodes: [
        {
          parameters: {
            functionCode: fixedFunctionCode
          },
          id: "advanced-error-processor",
          name: "Advanced Error Processor",
          type: "n8n-nodes-base.function",
          typeVersion: 1,
          position: [500, 300]
        }
      ]
    };
    
    const postData = JSON.stringify(minimalUpdate);
    
    const options = {
      hostname: 'n8n.srv779128.hstgr.cloud',
      path: '/api/v1/workflows/gTcn8f7892yrUPRn',
      method: 'PATCH',
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
        if (res.statusCode === 200) {
          console.log('✅ Advanced Error Processor Fixed!');
          console.log('🔧 Applied Fixes:');
          console.log('   ✅ Added null safety checks');
          console.log('   ✅ Enhanced error extraction');  
          console.log('   ✅ Improved error handling');
          console.log('   ✅ Added try-catch blocks');
          console.log('');
          console.log('🎯 Error Logger Enhanced v2 is ready!');
        } else {
          console.log('❌ Update failed:', res.statusCode);
          console.log('Response:', data);
          
          // Try direct node editor approach
          console.log('\\n💡 Manual Fix Required:');
          console.log('1. Go to: https://n8n.srv779128.hstgr.cloud/workflow/gTcn8f7892yrUPRn');
          console.log('2. Open "Advanced Error Processor" node');
          console.log('3. Replace line 9 with:');
          console.log('   const message = (error && error.message) ? error.message.toLowerCase() : "";');
          console.log('4. Or use the complete fixed function code below:');
          console.log('');
          console.log(fixedFunctionCode);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      console.log('\\n💡 Manual Fix Instructions:');
      console.log('1. Open Error Logger Enhanced v2 in n8n');
      console.log('2. Edit "Advanced Error Processor" node');
      console.log('3. Replace the problematic line with null-safe version');
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error.message);
  }
}

quickFixProcessor();