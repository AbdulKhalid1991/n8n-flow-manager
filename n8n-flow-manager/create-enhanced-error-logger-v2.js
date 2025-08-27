import https from 'https';
import { config } from 'dotenv';

config();

const agent = new https.Agent({
  rejectUnauthorized: false
});

// Enhanced Error Logger workflow with advanced features based on repository analysis
const enhancedWorkflow = {
  name: "Error Logger Enhanced v2",
  nodes: [
    // 1. Error Trigger - Enhanced with additional context
    {
      parameters: {
        includeExecutionId: true,
        includeDateTime: true,
        includeWorkflowId: true
      },
      id: "error-trigger-enhanced",
      name: "Enhanced Error Trigger",
      type: "n8n-nodes-base.errorTrigger",
      typeVersion: 1,
      position: [260, 300]
    },
    
    // 2. Advanced Error Processor - Enhanced function with AI analysis
    {
      parameters: {
        functionCode: `
// Advanced Error Analysis & Processing
const errorData = $input.first();
const execution = $execution;
const workflow = $workflow;

// Enhanced error categorization
function categorizeError(error) {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
    return { category: 'NETWORK', severity: 'HIGH', recoverable: true };
  } else if (message.includes('authentication') || message.includes('unauthorized') || message.includes('forbidden')) {
    return { category: 'AUTH', severity: 'CRITICAL', recoverable: false };
  } else if (message.includes('database') || message.includes('sql') || message.includes('connection')) {
    return { category: 'DATABASE', severity: 'HIGH', recoverable: true };
  } else if (message.includes('api') || message.includes('request') || message.includes('response')) {
    return { category: 'API', severity: 'MEDIUM', recoverable: true };
  } else if (message.includes('validation') || message.includes('invalid') || message.includes('format')) {
    return { category: 'VALIDATION', severity: 'LOW', recoverable: true };
  } else if (message.includes('memory') || message.includes('heap') || message.includes('out of')) {
    return { category: 'RESOURCE', severity: 'CRITICAL', recoverable: false };
  }
  return { category: 'GENERAL', severity: 'MEDIUM', recoverable: true };
}

// Generate unique error ID
const errorId = \`ERR-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;

// Enhanced error analysis
const errorAnalysis = categorizeError(errorData.error);

// Create comprehensive error report
const errorReport = {
  errorId: errorId,
  timestamp: new Date().toISOString(),
  
  // Basic error info
  message: errorData.error?.message || 'Unknown error',
  stack: errorData.error?.stack || 'No stack trace',
  type: errorData.error?.constructor?.name || 'Error',
  
  // Enhanced categorization
  category: errorAnalysis.category,
  severity: errorAnalysis.severity,
  recoverable: errorAnalysis.recoverable,
  
  // Execution context
  workflowId: workflow.id,
  workflowName: workflow.name,
  executionId: execution.id,
  nodeId: errorData.node?.id || 'unknown',
  nodeName: errorData.node?.name || 'Unknown Node',
  nodeType: errorData.node?.type || 'unknown',
  
  // Enhanced metrics
  errorCount: 1,
  firstOccurrence: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  
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
    channels.push('email', 'slack', 'webhook');
  }
  
  return channels;
}

return [errorReport];
`
      },
      id: "advanced-error-processor",
      name: "Advanced Error Processor",
      type: "n8n-nodes-base.function",
      typeVersion: 1,
      position: [500, 300]
    },
    
    // 3. Enhanced Google Sheets Logger with better formatting
    {
      parameters: {
        operation: "append",
        documentId: "1example_sheet_id",
        sheetName: "Enhanced_Error_Log",
        columns: {
          mappingMode: "defineBelow",
          value: {
            "Timestamp": "={{ $json.timestamp }}",
            "Error ID": "={{ $json.errorId }}",
            "Severity": "={{ $json.severity }}",
            "Category": "={{ $json.category }}",
            "Message": "={{ $json.message }}",
            "Workflow": "={{ $json.workflowName }}",
            "Node": "={{ $json.nodeName }}",
            "Recoverable": "={{ $json.recoverable }}",
            "Environment": "={{ $json.environment }}",
            "Recovery Suggestions": "={{ $json.recoverySuggestions.join('; ') }}",
            "Stack Trace": "={{ $json.stack }}"
          }
        },
        options: {
          valueRenderMode: "formatted",
          insertDataOption: "INSERT_ROWS",
          valueInputOption: "USER_ENTERED"
        }
      },
      id: "enhanced-sheets-logger",
      name: "Enhanced Google Sheets Logger",
      type: "n8n-nodes-base.googleSheets",
      typeVersion: 4.5,
      position: [740, 180]
    },
    
    // 4. Smart Telegram Alert with conditional formatting
    {
      parameters: {
        chatId: "-1001234567890",
        text: `🚨 **Error Alert {{ $json.severity }}**

📋 **Error Details:**
• ID: \`{{ $json.errorId }}\`
• Category: {{ $json.category }}
• Severity: {{ $json.severity }}
• Time: {{ $json.timestamp }}

🔧 **Workflow Context:**
• Workflow: {{ $json.workflowName }}
• Node: {{ $json.nodeName }}
• Execution: {{ $json.executionId }}

❌ **Error Message:**
\`{{ $json.message }}\`

💡 **Recovery Suggestions:**
{{ $json.recoverySuggestions.join("\\n• ") }}

🔄 **Recoverable:** {{ $json.recoverable ? "✅ Yes" : "❌ No" }}`,
        parseMode: "Markdown",
        additionalFields: {
          disable_notification: "={{ $json.severity === 'LOW' }}"
        }
      },
      id: "smart-telegram-alert",
      name: "Smart Telegram Alert",
      type: "n8n-nodes-base.telegram",
      typeVersion: 1.2,
      position: [740, 300]
    },
    
    // 5. Critical Error Email (only for CRITICAL severity)
    {
      parameters: {
        resource: "email",
        operation: "send",
        to: "admin@company.com",
        subject: "🚨 CRITICAL Error in {{ $json.workflowName }} - {{ $json.errorId }}",
        text: `CRITICAL ERROR DETECTED

Error ID: {{ $json.errorId }}
Timestamp: {{ $json.timestamp }}
Workflow: {{ $json.workflowName }}
Node: {{ $json.nodeName }}

Error Message:
{{ $json.message }}

Stack Trace:
{{ $json.stack }}

Recovery Suggestions:
{{ $json.recoverySuggestions.join("\\n- ") }}

This error requires immediate attention as it is marked as non-recoverable.

Environment: {{ $json.environment }}
Execution ID: {{ $json.executionId }}`,
        options: {
          priority: "high"
        }
      },
      id: "critical-email-alert",
      name: "Critical Error Email",
      type: "n8n-nodes-base.emailSend",
      typeVersion: 2.1,
      position: [740, 420]
    },
    
    // 6. Error Metrics Webhook for monitoring systems
    {
      parameters: {
        httpMethod: "POST",
        url: "https://your-monitoring-system.com/api/metrics",
        options: {
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer monitoring_token"
          },
          body: {
            "metric_type": "error_occurrence",
            "error_id": "={{ $json.errorId }}",
            "severity": "={{ $json.severity }}",
            "category": "={{ $json.category }}",
            "workflow_id": "={{ $json.workflowId }}",
            "timestamp": "={{ $json.timestamp }}",
            "recoverable": "={{ $json.recoverable }}",
            "environment": "={{ $json.environment }}"
          }
        }
      },
      id: "metrics-webhook",
      name: "Error Metrics Webhook",
      type: "n8n-nodes-base.httpRequest",
      typeVersion: 4.2,
      position: [740, 540]
    },
    
    // 7. Conditional Router for severity-based routing
    {
      parameters: {
        conditions: {
          options: {
            caseSensitive: true,
            leftValue: "",
            typeValidation: "strict"
          },
          conditions: [
            {
              leftValue: "={{ $json.severity }}",
              rightValue: "CRITICAL",
              operator: {
                type: "string",
                operation: "equals"
              }
            }
          ],
          combineOperation: "any"
        }
      },
      id: "severity-router",
      name: "Severity Router",
      type: "n8n-nodes-base.if",
      typeVersion: 2,
      position: [500, 500]
    }
  ],
  
  connections: {
    "Enhanced Error Trigger": {
      "main": [
        [
          {
            "node": "Advanced Error Processor",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Advanced Error Processor": {
      "main": [
        [
          {
            "node": "Enhanced Google Sheets Logger",
            "type": "main",
            "index": 0
          },
          {
            "node": "Smart Telegram Alert",
            "type": "main",
            "index": 0
          },
          {
            "node": "Severity Router",
            "type": "main",
            "index": 0
          },
          {
            "node": "Error Metrics Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Severity Router": {
      "main": [
        [
          {
            "node": "Critical Error Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  
  settings: {
    executionOrder: "v1"
  }
};

// Create the enhanced workflow
async function createEnhancedErrorLogger() {
  console.log('🚀 Creating Enhanced Error Logger v2...\n');
  
  const postData = JSON.stringify(enhancedWorkflow);
  
  const options = {
    hostname: 'n8n.srv779128.hstgr.cloud',
    path: '/api/v1/workflows',
    method: 'POST',
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    agent: agent
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 201 || res.statusCode === 200) {
            const workflow = JSON.parse(data);
            console.log('✅ Enhanced Error Logger v2 Created Successfully!');
            console.log('📋 Workflow Details:');
            console.log('   ID:', workflow.id);
            console.log('   Name:', workflow.name);
            console.log('   Total Nodes:', workflow.nodes.length);
            console.log('   Status: Ready for activation');
            
            console.log('\n🔧 Enhanced Features:');
            console.log('   ✅ Advanced error categorization (6 categories)');
            console.log('   ✅ Severity-based routing (LOW/MEDIUM/HIGH/CRITICAL)');
            console.log('   ✅ Recovery suggestions engine');
            console.log('   ✅ Multiple notification channels');
            console.log('   ✅ Metrics webhook integration');
            console.log('   ✅ Conditional critical alerts');
            console.log('   ✅ Enhanced context capture');
            
            console.log('\n📊 Workflow Architecture:');
            workflow.nodes.forEach((node, i) => {
              console.log(`   ${i+1}. ${node.name} (${node.type})`);
            });
            
            resolve(workflow);
          } else {
            console.log('❌ Failed to create workflow');
            console.log('Status:', res.statusCode);
            console.log('Response:', data);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Execute the creation
createEnhancedErrorLogger()
  .then(() => {
    console.log('\n🎯 Enhancement Complete!');
    console.log('✅ Error Logger Enhanced v2 is ready for testing');
    console.log('💡 Next steps: Activate the workflow and test error scenarios');
  })
  .catch((error) => {
    console.error('\n❌ Enhancement failed:', error.message);
  });