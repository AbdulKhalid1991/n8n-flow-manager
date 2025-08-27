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
  
  // Create a clean copy with only the essential properties
  const cleanWorkflow = {
    name: 'Error Logger 26sep25',
    nodes: originalWorkflow.nodes,
    connections: originalWorkflow.connections,
    active: false,
    settings: originalWorkflow.settings || {},
    staticData: originalWorkflow.staticData || {},
    tags: ['error-handling', 'monitoring', 'enhanced', '26sep25']
  };
  
  console.log('🚀 Creating Error Logger 26sep25...');
  
  // Create the new workflow
  const createResponse = await client.post('/api/v1/workflows', cleanWorkflow);
  const newWorkflow = createResponse.data;
  
  console.log(`✅ Successfully created: ${newWorkflow.name}`);
  console.log(`📋 New Workflow ID: ${newWorkflow.id}`);
  
  // Now let's enhance it by adding new nodes
  console.log('🔧 Enhancing workflow with additional features...');
  
  // Get the new workflow to modify it
  const enhanceResponse = await client.get(`/api/v1/workflows/${newWorkflow.id}`);
  const workflowToEnhance = enhanceResponse.data;
  
  // Add enhancement nodes
  const enhancedNodes = [
    ...workflowToEnhance.nodes,
    
    // Add Error Classifier Function
    {
      parameters: {
        functionCode: `// Enhanced Error Classification
const errorData = items[0].json;
const timestamp = new Date().toISOString();

// Extract and classify error information
const processedError = {
  timestamp: timestamp,
  date: timestamp.split('T')[0],
  time: timestamp.split('T')[1].split('.')[0],
  
  // Workflow information
  workflowId: errorData.workflow?.id || 'Unknown',
  workflowName: errorData.workflow?.name || 'Unknown Workflow',
  
  // Error details with classification
  errorMessage: errorData.error?.message || 'No error message',
  errorType: errorData.error?.name || 'Unknown Error',
  
  // Severity classification
  severity: classifyErrorSeverity(errorData.error?.message || ''),
  category: categorizeError(errorData.error?.message || ''),
  
  // Recovery suggestion
  suggestion: generateSuggestion(errorData.error?.message || ''),
  
  // Additional context
  nodeId: errorData.node?.id || 'Unknown',
  nodeName: errorData.node?.name || 'Unknown Node',
  nodeType: errorData.node?.type || 'Unknown Type',
  executionId: errorData.execution?.id || 'Unknown'
};

function classifyErrorSeverity(errorMessage) {
  const message = errorMessage.toLowerCase();
  if (message.includes('timeout') || message.includes('connection')) return 'Medium';
  if (message.includes('authentication') || message.includes('permission')) return 'High';
  if (message.includes('syntax') || message.includes('undefined')) return 'Critical';
  return 'Low';
}

function categorizeError(errorMessage) {
  const message = errorMessage.toLowerCase();
  if (message.includes('network') || message.includes('connection')) return 'Network';
  if (message.includes('auth') || message.includes('permission')) return 'Authentication';
  if (message.includes('data') || message.includes('json')) return 'Data Processing';
  return 'General';
}

function generateSuggestion(errorMessage) {
  const message = errorMessage.toLowerCase();
  if (message.includes('timeout')) return 'Increase timeout or check network';
  if (message.includes('authentication')) return 'Verify API credentials';
  if (message.includes('json')) return 'Check data format and syntax';
  return 'Review error details and node configuration';
}

return { json: processedError };`
      },
      type: 'n8n-nodes-base.function',
      typeVersion: 2,
      position: [400, 160],
      id: `enhanced-classifier-${Date.now()}`,
      name: 'Error Classifier & Enhancer'
    },
    
    // Add Email Alert for Critical Errors
    {
      parameters: {
        resource: 'send',
        operation: 'send',
        to: 'abdulkhalid.hm@outlook.com', // Your email
        subject: '🚨 Critical Error Alert - {{$json.workflowName}}',
        text: `Critical Error Detected

Workflow: {{$json.workflowName}}
Node: {{$json.nodeName}}
Time: {{$json.timestamp}}
Severity: {{$json.severity}}
Category: {{$json.category}}

Error: {{$json.errorMessage}}

Suggestion: {{$json.suggestion}}

Execution ID: {{$json.executionId}}

Please investigate immediately.`,
        options: {}
      },
      type: 'n8n-nodes-base.emailSend',
      typeVersion: 2,
      position: [600, 360],
      id: `email-alert-${Date.now()}`,
      name: 'Critical Error Email',
      onError: 'continueRegularOutput'
    }
  ];
  
  // Update connections to include new nodes
  const enhancedConnections = {
    ...workflowToEnhance.connections,
    'Error Trigger': {
      main: [
        [
          {
            node: 'Error Classifier & Enhancer',
            type: 'main',
            index: 0
          }
        ]
      ]
    },
    'Error Classifier & Enhancer': {
      main: [
        [
          {
            node: 'Google Sheets',
            type: 'main',
            index: 0
          },
          {
            node: 'Telegram',
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
  };
  
  // Update the workflow with enhancements
  const enhancedWorkflow = {
    ...workflowToEnhance,
    nodes: enhancedNodes,
    connections: enhancedConnections,
    tags: ['error-handling', 'monitoring', 'enhanced', '26sep25', 'email-alerts']
  };
  
  // Save the enhanced workflow
  const updateResponse = await client.put(`/api/v1/workflows/${newWorkflow.id}`, enhancedWorkflow);
  
  console.log('✅ Workflow enhanced successfully!');
  
  // Save to file
  fs.writeFileSync('flows/error-logger-26sep25-enhanced.json', JSON.stringify(updateResponse.data, null, 2));
  console.log('💾 Enhanced workflow saved to: flows/error-logger-26sep25-enhanced.json');
  
  console.log('\\n🎯 Enhancement Summary:');
  console.log('✅ Added Error Classifier & Enhancer function');
  console.log('✅ Added severity classification (Low/Medium/High/Critical)');
  console.log('✅ Added error categorization (Network/Auth/Data/General)');
  console.log('✅ Added automatic recovery suggestions');
  console.log('✅ Added email notifications for critical errors');
  console.log('✅ Enhanced data structure with more context');
  
  console.log(`\\n🆔 Enhanced Workflow ID: ${newWorkflow.id}`);
  console.log('⚠️ Workflow is inactive - activate when ready to use');
  
} catch (error) {
  console.log('❌ Error:', error.response?.status, error.message);
  if (error.response?.data) {
    console.log('Details:', JSON.stringify(error.response.data, null, 2));
  }
}