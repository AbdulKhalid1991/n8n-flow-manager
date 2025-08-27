import https from 'https';
import { config } from 'dotenv';

config();

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testEmailConfiguration() {
  console.log('🔍 Testing Email Configuration in Error Logger Enhanced v2...');
  
  try {
    // Check workflow executions to see if email node is being triggered
    const executionsOptions = {
      hostname: 'n8n.srv779128.hstgr.cloud',
      path: '/api/v1/executions?workflowId=gTcn8f7892yrUPRn&limit=10',
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Accept': 'application/json'
      },
      agent: agent
    };

    console.log('📊 Checking recent workflow executions...');
    
    const executions = await makeRequest(executionsOptions);
    
    if (executions.data && executions.data.length > 0) {
      console.log(`✅ Found ${executions.data.length} recent executions`);
      
      executions.data.forEach((execution, i) => {
        console.log(`\\n📋 Execution ${i + 1}:`);
        console.log(`   ID: ${execution.id}`);
        console.log(`   Status: ${execution.finished ? '✅ Finished' : '⏳ Running'}`);
        console.log(`   Mode: ${execution.mode}`);
        console.log(`   Started: ${new Date(execution.startedAt).toLocaleString()}`);
        if (execution.stoppedAt) {
          console.log(`   Stopped: ${new Date(execution.stoppedAt).toLocaleString()}`);
        }
      });
      
      // Get detailed execution data for the most recent one
      if (executions.data[0]) {
        const latestExecution = executions.data[0];
        console.log('\\n🔍 Getting detailed execution data...');
        
        const detailOptions = {
          hostname: 'n8n.srv779128.hstgr.cloud',
          path: `/api/v1/executions/${latestExecution.id}`,
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': process.env.N8N_API_KEY,
            'Accept': 'application/json'
          },
          agent: agent
        };
        
        const executionDetail = await makeRequest(detailOptions);
        
        if (executionDetail.data && executionDetail.data.resultData) {
          console.log('\\n📊 Node Execution Results:');
          
          Object.keys(executionDetail.data.resultData.runData || {}).forEach(nodeName => {
            const nodeData = executionDetail.data.resultData.runData[nodeName];
            console.log(`\\n🔧 ${nodeName}:`);
            console.log(`   Executions: ${nodeData.length}`);
            
            if (nodeData.length > 0) {
              const lastRun = nodeData[nodeData.length - 1];
              console.log(`   Status: ${lastRun.error ? '❌ Error' : '✅ Success'}`);
              console.log(`   Start: ${new Date(lastRun.startTime).toLocaleString()}`);
              console.log(`   Duration: ${lastRun.executionTime}ms`);
              
              if (lastRun.error) {
                console.log(`   Error: ${lastRun.error.message}`);
              }
              
              if (nodeName === 'Critical Error Email') {
                console.log('\\n📧 CRITICAL EMAIL NODE ANALYSIS:');
                if (lastRun.error) {
                  console.log(`   ❌ Email sending failed: ${lastRun.error.message}`);
                } else {
                  console.log('   ✅ Email node executed successfully');
                  if (lastRun.data && lastRun.data.main) {
                    console.log('   📨 Email data processed');
                  }
                }
              }
              
              if (nodeName === 'Severity Router') {
                console.log('\\n🔄 SEVERITY ROUTER ANALYSIS:');
                if (lastRun.data && lastRun.data.main && lastRun.data.main[0]) {
                  console.log(`   ✅ Router triggered: ${lastRun.data.main[0].length} items passed through`);
                  if (lastRun.data.main[0][0]) {
                    const routerData = lastRun.data.main[0][0];
                    console.log(`   📊 Severity detected: ${routerData.severity || 'unknown'}`);
                  }
                } else {
                  console.log('   ❌ Router did not pass any data (severity not CRITICAL?)');
                }
              }
            }
          });
        }
      }
      
    } else {
      console.log('❌ No recent executions found');
      console.log('💡 The workflow might not have been triggered recently');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\\n🎯 Common Email Issues to Check:');
  console.log('   1. ❓ Is the workflow active?');
  console.log('   2. ❓ Are errors actually CRITICAL severity?');
  console.log('   3. ❓ Is the SMTP credential properly configured?');
  console.log('   4. ❓ Is the Gmail App Password correct?');
  console.log('   5. ❓ Check spam/junk folder');
  console.log('   6. ❓ Is 2FA enabled on Gmail?');
}

function makeRequest(options) {
  return new Promise((resolve, reject) => {
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

testEmailConfiguration();