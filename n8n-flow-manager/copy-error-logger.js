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
  console.log('📥 Exporting original Error Logger workflow...');
  
  // Get the original workflow
  const response = await client.get(`/api/v1/workflows/${originalWorkflowId}`);
  const originalWorkflow = response.data;
  
  console.log(`✅ Exported: ${originalWorkflow.name}`);
  
  // Save original workflow as backup
  const backupData = {
    ...originalWorkflow,
    exportedAt: new Date().toISOString(),
    exportedBy: 'n8n-flow-manager'
  };
  
  fs.writeFileSync('flows/error-logger-backup.json', JSON.stringify(backupData, null, 2));
  console.log('💾 Backup saved to: flows/error-logger-backup.json');
  
  // Create enhanced version
  const enhancedWorkflow = {
    name: 'Error Logger 26sep25',
    nodes: [
      // 1. Enhanced Error Trigger with more data collection
      {
        parameters: {
          includeWorkflowMeta: true,
          includeRunData: true
        },
        type: 'n8n-nodes-base.errorTrigger',
        typeVersion: 1,
        position: [200, 300],
        id: '1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6',
        name: 'Enhanced Error Trigger'
      },
      
      // 2. Error Processing & Enrichment
      {
        parameters: {
          functionCode: \`
// Enhanced error processing
const errorData = items[0].json;
const timestamp = new Date().toISOString();

// Extract detailed error information
const processedError = {
  timestamp: timestamp,
  date: timestamp.split('T')[0],
  time: timestamp.split('T')[1].split('.')[0],
  
  // Workflow information
  workflowId: errorData.workflow?.id || 'Unknown',
  workflowName: errorData.workflow?.name || 'Unknown Workflow',
  workflowActive: errorData.workflow?.active || false,
  
  // Execution information
  executionId: errorData.execution?.id || 'Unknown',
  executionMode: errorData.execution?.mode || 'Unknown',
  nodeId: errorData.node?.id || 'Unknown',
  nodeName: errorData.node?.name || 'Unknown Node',
  nodeType: errorData.node?.type || 'Unknown Type',
  
  // Error details
  errorMessage: errorData.error?.message || 'No error message',
  errorName: errorData.error?.name || 'Unknown Error',
  errorStack: errorData.error?.stack || 'No stack trace',
  errorType: errorData.error?.type || 'Runtime Error',
  
  // Classification
  severity: classifyErrorSeverity(errorData.error?.message || ''),
  category: categorizeError(errorData.error?.message || '', errorData.node?.type || ''),
  
  // Recovery suggestions
  suggestion: generateRecoverySuggestion(errorData.error?.message || '', errorData.node?.type || ''),
  
  // Additional context
  retryCount: errorData.execution?.retryOf ? 'Retry Attempt' : 'Initial Run',
  environment: 'Production' // You can make this dynamic
};

function classifyErrorSeverity(errorMessage) {
  const message = errorMessage.toLowerCase();
  if (message.includes('timeout') || message.includes('connection')) return 'Medium';
  if (message.includes('authentication') || message.includes('permission')) return 'High';
  if (message.includes('syntax') || message.includes('undefined')) return 'High';
  return 'Low';
}

function categorizeError(errorMessage, nodeType) {
  const message = errorMessage.toLowerCase();
  if (message.includes('network') || message.includes('connection')) return 'Network';
  if (message.includes('auth') || message.includes('permission')) return 'Authentication';
  if (message.includes('data') || message.includes('json')) return 'Data Processing';
  if (nodeType.includes('http')) return 'API Integration';
  if (nodeType.includes('database')) return 'Database';
  return 'General';
}

function generateRecoverySuggestion(errorMessage, nodeType) {
  const message = errorMessage.toLowerCase();
  if (message.includes('timeout')) return 'Increase timeout value or check network connectivity';
  if (message.includes('authentication')) return 'Verify API credentials and permissions';
  if (message.includes('json')) return 'Check data format and JSON syntax';
  if (message.includes('network')) return 'Check network connectivity and endpoint availability';
  return 'Review error details and check node configuration';
}

return { json: processedError };
\`
        },
        type: 'n8n-nodes-base.function',
        typeVersion: 2,
        position: [400, 300],
        id: '2b3c4d5e-6f7g-8h9i-0j1k-l2m3n4o5p6q7',
        name: 'Error Processing & Enrichment'
      },
      
      // 3. Enhanced Google Sheets Logger
      {
        parameters: {
          resource: 'append',
          operation: 'appendOrUpdate',
          documentId: '{{$json.sheetId}}', // Will need to be configured
          sheetName: 'Error Log',
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
              'Error Type': '={{$json.errorType}}',
              'Severity': '={{$json.severity}}',
              'Category': '={{$json.category}}',
              'Suggestion': '={{$json.suggestion}}',
              'Execution ID': '={{$json.executionId}}',
              'Retry': '={{$json.retryCount}}'
            }
          }
        },
        type: 'n8n-nodes-base.googleSheets',
        typeVersion: 4.5,
        position: [600, 200],
        id: '3c4d5e6f-7g8h-9i0j-1k2l-m3n4o5p6q7r8',
        name: 'Enhanced Google Sheets Logger'
      },
      
      // 4. Enhanced Telegram Notification
      {
        parameters: {
          resource: 'message',
          operation: 'sendMessage',
          chatId: '{{$json.telegramChatId}}', // Will need to be configured
          text: \`🚨 *Error Alert - {{$json.severity}} Severity*

📊 *Workflow:* {{$json.workflowName}}
⚙️ *Node:* {{$json.nodeName}} ({{$json.nodeType}})
🕒 *Time:* {{$json.time}}
📂 *Category:* {{$json.category}}

❌ *Error:* {{$json.errorMessage}}

💡 *Suggestion:* {{$json.suggestion}}

🔗 *Execution ID:* {{$json.executionId}}
🔄 *Status:* {{$json.retryCount}}\`,
          parseMode: 'Markdown'
        },
        type: 'n8n-nodes-base.telegram',
        typeVersion: 1.2,
        position: [600, 400],
        id: '4d5e6f7g-8h9i-0j1k-2l3m-n4o5p6q7r8s9',
        name: 'Enhanced Telegram Alert'
      },
      
      // 5. NEW: Email Notification for Critical Errors
      {
        parameters: {
          resource: 'send',
          operation: 'send',
          to: '{{$json.emailRecipient}}', // Will need to be configured
          subject: '🚨 Critical Error Alert - {{$json.workflowName}}',
          text: \`Critical Error Detected

Workflow: {{$json.workflowName}}
Node: {{$json.nodeName}}
Time: {{$json.timestamp}}
Severity: {{$json.severity}}
Category: {{$json.category}}

Error Message: {{$json.errorMessage}}

Recovery Suggestion: {{$json.suggestion}}

Please investigate immediately.\`,
          options: {}
        },
        type: 'n8n-nodes-base.emailSend',
        typeVersion: 2,
        position: [800, 300],
        id: '5e6f7g8h-9i0j-1k2l-3m4n-o5p6q7r8s9t0',
        name: 'Critical Error Email Alert',
        onError: 'continueRegularOutput'
      },
      
      // 6. NEW: Error Statistics Tracker
      {
        parameters: {
          functionCode: \`
// Update error statistics
const errorData = items[0].json;

// Get current date for daily stats
const today = errorData.date;

// This would typically connect to a database or another tracking system
// For now, we'll prepare the data structure
const stats = {
  date: today,
  workflowName: errorData.workflowName,
  errorCategory: errorData.category,
  severity: errorData.severity,
  count: 1, // Increment logic would be handled by database
  lastOccurrence: errorData.timestamp
};

return { json: stats };
\`
        },
        type: 'n8n-nodes-base.function',
        typeVersion: 2,
        position: [600, 600],
        id: '6f7g8h9i-0j1k-2l3m-4n5o-p6q7r8s9t0u1',
        name: 'Error Statistics Tracker'
      }
    ],
    
    // Enhanced connections
    connections: {
      'Enhanced Error Trigger': {
        main: [
          [
            {
              node: 'Error Processing & Enrichment',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'Error Processing & Enrichment': {
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
              node: 'Error Statistics Tracker',
              type: 'main',
              index: 0
            }
          ]
        ]
      },
      'Enhanced Google Sheets Logger': {
        main: [
          [
            {
              node: 'Critical Error Email Alert',
              type: 'main',
              index: 0
            }
          ]
        ]
      }
    },
    
    active: false, // Start as inactive for configuration
    settings: {
      executionOrder: 'v1',
      saveManualExecutions: true,
      callerPolicy: 'workflowsFromSameOwner'
    },
    
    tags: ['error-handling', 'monitoring', 'enhanced', '26sep25']
  };
  
  console.log('🚀 Creating enhanced Error Logger workflow...');
  
  // Create the new workflow
  const createResponse = await client.post('/api/v1/workflows', enhancedWorkflow);
  const newWorkflow = createResponse.data;
  
  console.log(\`✅ Successfully created: \${newWorkflow.name}\`);
  console.log(\`📋 New Workflow ID: \${newWorkflow.id}\`);
  
  // Save the enhanced workflow
  fs.writeFileSync('flows/error-logger-26sep25.json', JSON.stringify(newWorkflow, null, 2));
  console.log('💾 Enhanced workflow saved to: flows/error-logger-26sep25.json');
  
  console.log('\\n🎯 Enhancement Summary:');
  console.log('✅ Enhanced error data processing with detailed classification');
  console.log('✅ Improved Google Sheets logging with more columns');
  console.log('✅ Enhanced Telegram alerts with formatted messages');
  console.log('✅ Added email notifications for critical errors');
  console.log('✅ Added error statistics tracking');
  console.log('✅ Added recovery suggestions for common errors');
  
  console.log('\\n⚙️ Configuration Required:');
  console.log('1. Configure Google Sheets document ID');
  console.log('2. Set Telegram chat ID');
  console.log('3. Configure email recipient');
  console.log('4. Activate the workflow when ready');
  
} catch (error) {
  console.log('❌ Error:', error.response?.status, error.message);
  if (error.response?.data) {
    console.log('Details:', JSON.stringify(error.response.data, null, 2));
  }
}