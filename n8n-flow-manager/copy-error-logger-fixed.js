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
  
  // Create enhanced version - first just copy the original and rename
  console.log('🚀 Creating enhanced Error Logger 26sep25...');
  
  const enhancedWorkflow = {
    ...originalWorkflow,
    name: 'Error Logger 26sep25',
    id: undefined, // Let n8n assign new ID
    tags: ['error-handling', 'monitoring', 'enhanced', '26sep25'],
    active: false, // Start inactive for configuration
    createdAt: undefined,
    updatedAt: undefined,
    versionId: undefined
  };
  
  // Create the new workflow
  const createResponse = await client.post('/api/v1/workflows', enhancedWorkflow);
  const newWorkflow = createResponse.data;
  
  console.log(`✅ Successfully created: ${newWorkflow.name}`);
  console.log(`📋 New Workflow ID: ${newWorkflow.id}`);
  
  // Save the workflow
  fs.writeFileSync('flows/error-logger-26sep25.json', JSON.stringify(newWorkflow, null, 2));
  console.log('💾 Workflow saved to: flows/error-logger-26sep25.json');
  
  console.log('\n🎯 Workflow copied successfully!');
  console.log('📋 Next steps:');
  console.log('1. The workflow is created but inactive');
  console.log('2. Ready for manual enhancements in n8n UI');
  console.log('3. Can be activated after configuration');
  
  console.log(`\n🆔 New Workflow ID for reference: ${newWorkflow.id}`);
  
} catch (error) {
  console.log('❌ Error:', error.response?.status, error.message);
  if (error.response?.data) {
    console.log('Details:', JSON.stringify(error.response.data, null, 2));
  }
}