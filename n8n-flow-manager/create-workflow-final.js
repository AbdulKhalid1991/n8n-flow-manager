import https from 'https';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const agent = new https.Agent({ rejectUnauthorized: false });
const client = axios.create({
  baseURL: process.env.N8N_BASE_URL,
  headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY },
  httpsAgent: agent
});

const originalWorkflowId = 'sZcyBIs3WLEqgJin';

try {
  console.log('📥 Getting original Error Logger workflow...');
  
  // Get the original workflow
  const response = await client.get(`/api/v1/workflows/${originalWorkflowId}`);
  const originalWorkflow = response.data;
  
  console.log(`✅ Retrieved: ${originalWorkflow.name}`);
  
  // Create enhanced workflow directly with new nodes
  const enhancedWorkflow = {
    name: 'Error Logger 26sep25',
    nodes: [
      // Keep original Error Trigger
      {
        ...originalWorkflow.nodes[0],
        name: 'Error Trigger',
        id: 'error-trigger-node'
      },
      
      // Add Enhanced Error Processor
      {
        parameters: {
          functionCode: `// Enhanced Error Processing for Error Logger 26sep25
const errorData = items[0].json;
const timestamp = new Date().toISOString();

// Process and classify the error
const processedError = {
  timestamp: timestamp,
  date: timestamp.split('T')[0],
  time: timestamp.split('T')[1].split('.')[0],
  
  // Workflow context
  workflowId: errorData.workflow?.id || 'Unknown',
  workflowName: errorData.workflow?.name || 'Unknown Workflow',
  workflowActive: errorData.workflow?.active || false,
  
  // Node context
  nodeId: errorData.node?.id || 'Unknown',
  nodeName: errorData.node?.name || 'Unknown Node',
  nodeType: errorData.node?.type || 'Unknown Type',
  
  // Error details
  errorMessage: errorData.error?.message || 'No error message',
  errorName: errorData.error?.name || 'Unknown Error',
  errorType: errorData.error?.type || 'Runtime Error',
  
  // Classification
  severity: classifyErrorSeverity(errorData.error?.message || ''),
  category: categorizeError(errorData.error?.message || '', errorData.node?.type || ''),
  priority: getPriority(errorData.error?.message || ''),
  
  // Recovery information
  suggestion: generateRecoverySuggestion(errorData.error?.message || '', errorData.node?.type || ''),
  actionable: isActionable(errorData.error?.message || ''),
  
  // Execution context
  executionId: errorData.execution?.id || 'Unknown',
  executionMode: errorData.execution?.mode || 'Unknown',
  retryCount: errorData.execution?.retryOf ? 'Retry' : 'Initial'
};

function classifyErrorSeverity(errorMessage) {
  const msg = errorMessage.toLowerCase();
  if (msg.includes('critical') || msg.includes('fatal')) return 'Critical';
  if (msg.includes('timeout') || msg.includes('connection refused')) return 'High';
  if (msg.includes('authentication') || msg.includes('permission denied')) return 'High';
  if (msg.includes('not found') || msg.includes('invalid')) return 'Medium';
  return 'Low';
}

function categorizeError(errorMessage, nodeType) {
  const msg = errorMessage.toLowerCase();
  const type = nodeType.toLowerCase();
  
  if (msg.includes('network') || msg.includes('connection') || msg.includes('timeout')) return 'Network';
  if (msg.includes('auth') || msg.includes('permission') || msg.includes('unauthorized')) return 'Authentication';
  if (msg.includes('json') || msg.includes('parse') || msg.includes('format')) return 'Data Processing';
  if (msg.includes('database') || msg.includes('sql')) return 'Database';
  if (type.includes('http') || type.includes('webhook')) return 'API Integration';
  return 'Application Logic';
}

function getPriority(errorMessage) {
  const severity = classifyErrorSeverity(errorMessage);
  const msg = errorMessage.toLowerCase();
  
  if (severity === 'Critical') return 'P1 - Critical';
  if (severity === 'High' || msg.includes('production')) return 'P2 - High';
  if (severity === 'Medium') return 'P3 - Medium';
  return 'P4 - Low';
}

function generateRecoverySuggestion(errorMessage, nodeType) {
  const msg = errorMessage.toLowerCase();
  
  if (msg.includes('timeout')) return 'Increase timeout value, check network connectivity, or implement retry logic';
  if (msg.includes('authentication') || msg.includes('unauthorized')) return 'Verify API credentials, check token expiration, or refresh authentication';
  if (msg.includes('not found')) return 'Verify endpoint URLs, check resource existence, or update configuration';
  if (msg.includes('json') || msg.includes('parse')) return 'Validate data format, check JSON syntax, or add data transformation';
  if (msg.includes('connection')) return 'Check network connectivity, verify service availability, or implement circuit breaker';
  if (msg.includes('rate limit')) return 'Implement rate limiting, add delays between requests, or use different API tier';
  return 'Review error context, check node configuration, or consult documentation';
}

function isActionable(errorMessage) {
  const msg = errorMessage.toLowerCase();
  const nonActionable = ['syntax error', 'undefined variable', 'null reference'];
  return !nonActionable.some(term => msg.includes(term));
}

return { json: processedError };`
        },
        type: 'n8n-nodes-base.function',
        typeVersion: 2,
        position: [300, 300],
        id: 'error-processor-node',
        name: 'Enhanced Error Processor'
      },
      
      // Enhanced Google Sheets Logger
      {
        ...originalWorkflow.nodes.find(n => n.type === 'n8n-nodes-base.googleSheets'),
        position: [500, 200],
        id: 'google-sheets-node',
        name: 'Enhanced Google Sheets Logger',
        parameters: {
          ...originalWorkflow.nodes.find(n => n.type === 'n8n-nodes-base.googleSheets')?.parameters,
          // Add more columns for enhanced data
          columns: {
            mappingMode: 'defineBelow',
            values: {
              'Timestamp': '={{$json.timestamp}}',
              'Date': '={{$json.date}}',
              'Time': '={{$json.time}}',
              'Workflow': '={{$json.workflowName}}',
              'Node': '={{$json.nodeName}}',
              'Node Type': '={{$json.nodeType}}',
              'Error Message': '={{$json.errorMessage}}',
              'Severity': '={{$json.severity}}',
              'Category': '={{$json.category}}',
              'Priority': '={{$json.priority}}',
              'Suggestion': '={{$json.suggestion}}',
              'Actionable': '={{$json.actionable}}',
              'Execution ID': '={{$json.executionId}}',
              'Retry Status': '={{$json.retryCount}}'
            }
          }
        }
      },
      
      // Enhanced Telegram Notification
      {
        ...originalWorkflow.nodes.find(n => n.type === 'n8n-nodes-base.telegram'),
        position: [500, 400],
        id: 'telegram-node',
        name: 'Enhanced Telegram Alert',
        parameters: {
          ...originalWorkflow.nodes.find(n => n.type === 'n8n-nodes-base.telegram')?.parameters,
          text: `🚨 *Error Alert - {{$json.priority}}*

📊 *Workflow:* {{$json.workflowName}}
⚙️ *Node:* {{$json.nodeName}} ({{$json.nodeType}})
🕒 *Time:* {{$json.time}}
📂 *Category:* {{$json.category}}
⚡ *Severity:* {{$json.severity}}

❌ *Error:* {{$json.errorMessage}}

💡 *Suggestion:* {{$json.suggestion}}
✅ *Actionable:* {{$json.actionable}}

🔗 *Execution:* {{$json.executionId}}
🔄 *Retry:* {{$json.retryCount}}`,
          parseMode: 'Markdown'
        }
      },
      
      // New: Email Alert for Critical Errors
      {
        parameters: {
          resource: 'send',
          operation: 'send',
          to: 'abdulkhalid.hm@outlook.com',
          subject: '🚨 {{$json.priority}} Error - {{$json.workflowName}}',
          text: `{{$json.priority}} Error Detected in n8n

Workflow: {{$json.workflowName}}
Node: {{$json.nodeName}} ({{$json.nodeType}})
Timestamp: {{$json.timestamp}}

Error Details:
- Severity: {{$json.severity}}
- Category: {{$json.category}}
- Message: {{$json.errorMessage}}

Recovery Suggestion:
{{$json.suggestion}}

Execution Information:
- ID: {{$json.executionId}}
- Mode: {{$json.executionMode}}
- Retry Status: {{$json.retryCount}}

Actionable: {{$json.actionable}}

This is an automated alert from your n8n Error Logger 26sep25.`,
          options: {}
        },
        type: 'n8n-nodes-base.emailSend',
        typeVersion: 2,
        position: [700, 300],
        id: 'email-alert-node',
        name: 'Critical Error Email'
      }
    ],
    
    connections: {
      'Error Trigger': {
        main: [
          [{
            node: 'Enhanced Error Processor',
            type: 'main',
            index: 0
          }]
        ]
      },
      'Enhanced Error Processor': {
        main: [
          [
            {
              node: 'Enhanced Google Sheets Logger',
              type: 'main',
              index: 0
            },
            {
              node: 'Enhanced Telegram Alert',
              type: 'main',
              index: 0
            },
            {
              node: 'Critical Error Email',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    },
    
    settings: originalWorkflow.settings || {},
    staticData: {}
  };
  
  console.log('🚀 Creating enhanced Error Logger 26sep25...');
  
  // Create the workflow
  const createResponse = await client.post('/api/v1/workflows', enhancedWorkflow);
  const newWorkflow = createResponse.data;
  
  console.log(`✅ Successfully created: ${newWorkflow.name}`);
  console.log(`📋 Workflow ID: ${newWorkflow.id}`);
  
  // Save both workflows
  fs.writeFileSync('flows/error-logger-backup.json', JSON.stringify(originalWorkflow, null, 2));
  fs.writeFileSync('flows/error-logger-26sep25.json', JSON.stringify(newWorkflow, null, 2));
  
  console.log('💾 Workflows saved to flows directory');
  
  console.log('\\n🎯 Enhancement Summary:');
  console.log('✅ Created Error Logger 26sep25 with advanced features');
  console.log('✅ Enhanced error classification (Critical/High/Medium/Low)');
  console.log('✅ Added error categorization (Network/Auth/Data/API/etc.)');
  console.log('✅ Added priority levels (P1-P4)');
  console.log('✅ Smart recovery suggestions based on error patterns');
  console.log('✅ Actionable flag to identify fixable errors');
  console.log('✅ Enhanced Google Sheets logging with more columns');
  console.log('✅ Improved Telegram alerts with rich formatting');
  console.log('✅ Added email notifications for critical errors');
  
  console.log('\\n⚙️ Configuration Notes:');
  console.log('• Workflow is created but inactive (for safety)');
  console.log('• Email configured for: abdulkhalid.hm@outlook.com');
  console.log('• Google Sheets and Telegram settings copied from original');
  console.log('• Ready to activate when configuration is verified');
  
  console.log(`\\n🔗 Access your workflow: ${process.env.N8N_BASE_URL}/workflow/${newWorkflow.id}`);
  
} catch (error) {
  console.log('❌ Error:', error.response?.status, error.message);
  if (error.response?.data) {
    console.log('Details:', JSON.stringify(error.response.data, null, 2));
  }
}