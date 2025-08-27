import https from 'https';
import { config } from 'dotenv';

config();

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function createEmailTest() {
  console.log('🧪 Creating Email Test Workflow...');
  
  const testWorkflow = {
    name: "Email Test - CRITICAL Error",
    nodes: [
      {
        parameters: {},
        id: "manual-trigger",
        name: "Manual Trigger",
        type: "n8n-nodes-base.manualTrigger",
        typeVersion: 1,
        position: [240, 300]
      },
      {
        parameters: {
          functionCode: `
// Force CRITICAL error for email test
const criticalError = {
  errorId: 'TEST-' + Date.now(),
  timestamp: new Date().toISOString(),
  message: 'AUTHENTICATION FAILED - This is a test critical error',
  category: 'AUTH',
  severity: 'CRITICAL',
  recoverable: false,
  workflowName: 'Email Test Workflow',
  nodeName: 'Test Node',
  executionId: $execution.id,
  recoverySuggestions: [
    'Check authentication credentials',
    'Verify API keys',
    'Review access permissions'
  ]
};

console.log('Generated CRITICAL error for email test:', criticalError);

return [criticalError];
`
        },
        id: "force-critical-error",
        name: "Force CRITICAL Error",
        type: "n8n-nodes-base.function",
        typeVersion: 1,
        position: [460, 300]
      },
      {
        parameters: {
          to: "abdulkhalid.api@gmail.com",
          subject: "🧪 TEST: Critical Error Alert - {{ $json.errorId }}",
          text: `TEST EMAIL - CRITICAL ERROR DETECTED

This is a test email to verify your critical error email configuration.

📋 Error Details:
• Error ID: {{ $json.errorId }}
• Severity: {{ $json.severity }}
• Category: {{ $json.category }}
• Message: {{ $json.message }}
• Time: {{ $json.timestamp }}

🔧 Context:
• Workflow: {{ $json.workflowName }}
• Node: {{ $json.nodeName }}
• Execution: {{ $json.executionId }}

💡 Recovery Suggestions:
{{ $json.recoverySuggestions.join("\\n• ") }}

✅ If you receive this email, your CRITICAL error email configuration is working!

---
This is a test from n8n Error Logger Enhanced v2`
        },
        id: "test-email",
        name: "Test Email",
        type: "n8n-nodes-base.emailSend",
        typeVersion: 2.1,
        position: [680, 300]
      }
    ],
    connections: {
      "Manual Trigger": {
        "main": [
          [
            {
              "node": "Force CRITICAL Error",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Force CRITICAL Error": {
        "main": [
          [
            {
              "node": "Test Email",
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

  try {
    const workflow = await createWorkflow(testWorkflow);
    
    console.log('✅ Email Test Workflow Created!');
    console.log('📋 Workflow ID:', workflow.id);
    console.log('🔗 URL:', `https://n8n.srv779128.hstgr.cloud/workflow/${workflow.id}`);
    console.log('');
    console.log('🧪 Test Instructions:');
    console.log('1. Go to the workflow URL above');
    console.log('2. Configure the Test Email node with your SMTP credentials');
    console.log('3. Click "Execute Workflow"');
    console.log('4. Check your email (abdulkhalid.api@gmail.com)');
    console.log('5. Check spam folder if not in inbox');
    console.log('');
    console.log('📧 Expected Result:');
    console.log('   Subject: 🧪 TEST: Critical Error Alert - TEST-[timestamp]');
    console.log('   Content: Detailed test error information');
    console.log('');
    console.log('🎯 If this works, your email is configured correctly!');
    
  } catch (error) {
    console.error('❌ Failed to create test workflow:', error.message);
  }
}

function createWorkflow(workflow) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(workflow);
    
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

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 201 || res.statusCode === 200) {
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

createEmailTest();