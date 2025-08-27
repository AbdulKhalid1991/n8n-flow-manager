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
  console.log('🔍 Verifying Error Logger 26sep25 creation...\n');
  
  const response = await client.get('/api/v1/workflows');
  const workflows = response.data.data;
  
  console.log('📋 Current Workflow List:');
  workflows.forEach((w, index) => {
    const status = w.active ? '🟢 Active' : '🔴 Inactive';
    const isNew = w.name.includes('26sep25') ? '✨ NEW!' : '';
    const isOriginal = w.name === 'Error Logger' ? '📄 Original' : '';
    console.log(`${index + 1}. ${w.name} (ID: ${w.id}) - ${status} ${isNew}${isOriginal}`);
  });
  
  // Get details of the new workflow
  const newWorkflow = workflows.find(w => w.name === 'Error Logger 26sep25');
  
  if (newWorkflow) {
    console.log('\n🔍 Error Logger 26sep25 Details:');
    console.log(`Name: ${newWorkflow.name}`);
    console.log(`ID: ${newWorkflow.id}`);
    console.log(`Status: ${newWorkflow.active ? '🟢 Active' : '🔴 Inactive'}`);
    console.log(`Created: ${new Date(newWorkflow.createdAt).toLocaleString()}`);
    
    // Get full workflow details
    const detailResponse = await client.get(`/api/v1/workflows/${newWorkflow.id}`);
    const details = detailResponse.data;
    
    console.log(`\nNodes: ${details.nodes?.length || 0}`);
    console.log('Node Structure:');
    details.nodes?.forEach((node, index) => {
      console.log(`  ${index + 1}. ${node.name} (${node.type})`);
    });
    
    console.log('\n🔗 Connections:');
    const connections = details.connections || {};
    Object.keys(connections).forEach(nodeName => {
      const nodeConnections = connections[nodeName];
      if (nodeConnections.main) {
        nodeConnections.main[0]?.forEach(conn => {
          console.log(`  ${nodeName} → ${conn.node}`);
        });
      }
    });
    
    console.log('\n✅ Enhanced Features Confirmed:');
    const hasEnhancedProcessor = details.nodes?.some(n => n.name.includes('Enhanced Error Processor'));
    const hasEmailAlert = details.nodes?.some(n => n.name.includes('Critical Error Email'));
    const hasEnhancedSheets = details.nodes?.some(n => n.name.includes('Enhanced Google Sheets'));
    const hasEnhancedTelegram = details.nodes?.some(n => n.name.includes('Enhanced Telegram'));
    
    console.log(`📊 Enhanced Error Processor: ${hasEnhancedProcessor ? '✅' : '❌'}`);
    console.log(`📧 Email Alerts: ${hasEmailAlert ? '✅' : '❌'}`);
    console.log(`📄 Enhanced Google Sheets: ${hasEnhancedSheets ? '✅' : '❌'}`);
    console.log(`📱 Enhanced Telegram: ${hasEnhancedTelegram ? '✅' : '❌'}`);
    
    console.log('\n🎯 Workflow Enhancement Complete!');
    console.log(`🔗 Edit workflow: ${process.env.N8N_BASE_URL}/workflow/${newWorkflow.id}`);
    
  } else {
    console.log('\n❌ Error Logger 26sep25 not found!');
  }
  
} catch (error) {
  console.log('❌ Error:', error.response?.status, error.message);
}