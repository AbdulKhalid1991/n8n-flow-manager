import https from 'https';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const agent = new https.Agent({ rejectUnauthorized: false });
const client = axios.create({
  baseURL: process.env.N8N_BASE_URL,
  headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY },
  httpsAgent: agent
});

try {
  const response = await client.get('/api/v1/workflows');
  const workflows = response.data.data;
  
  console.log('🔍 Searching for Error Logger workflow...\n');
  
  // Search for workflows containing 'error' or 'log' in name
  const errorLoggerWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes('error') || 
    w.name.toLowerCase().includes('log') ||
    w.name.toLowerCase().includes('logger')
  );
  
  if (errorLoggerWorkflows.length > 0) {
    console.log('✅ Found Error/Logger workflows:');
    errorLoggerWorkflows.forEach(workflow => {
      console.log(`\n📋 Workflow: ${workflow.name}`);
      console.log(`   ID: ${workflow.id}`);
      console.log(`   Active: ${workflow.active}`);
      console.log(`   Created: ${new Date(workflow.createdAt).toLocaleString()}`);
      console.log(`   Updated: ${new Date(workflow.updatedAt).toLocaleString()}`);
      console.log(`   Tags: ${workflow.tags?.join(', ') || 'None'}`);
    });
  } else {
    console.log('❌ No Error Logger workflows found by name');
  }
  
  console.log('\n📋 All available workflows:');
  workflows.forEach((w, index) => {
    console.log(`${index + 1}. ${w.name} (ID: ${w.id}) - Active: ${w.active}`);
  });
  
  console.log('\n💡 Would you like me to:');
  console.log('1. Create a new Error Logger workflow');
  console.log('2. Analyze an existing workflow for error handling');
  console.log('3. Export a specific workflow for review');
  
} catch (error) {
  console.log('❌ Error:', error.message);
}