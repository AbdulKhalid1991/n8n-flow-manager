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

const workflowId = 'sZcyBIs3WLEqgJin';

try {
  console.log('🔍 Getting Error Logger workflow details...\n');
  
  // Get workflow details
  const response = await client.get(`/api/v1/workflows/${workflowId}`);
  console.log('Raw response status:', response.status);
  console.log('Raw response data keys:', Object.keys(response.data));
  
  const workflow = response.data;
  
  if (workflow) {
    console.log('\n📋 Error Logger Workflow:');
    console.log(`Name: ${workflow.name || 'N/A'}`);
    console.log(`ID: ${workflow.id || workflowId}`);
    console.log(`Active: ${workflow.active}`);
    console.log(`Created: ${workflow.createdAt ? new Date(workflow.createdAt).toLocaleString() : 'N/A'}`);
    console.log(`Updated: ${workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleString() : 'N/A'}`);
    
    // Check nodes
    if (workflow.nodes && Array.isArray(workflow.nodes)) {
      console.log(`\n🔧 Workflow Structure:`);
      console.log(`Total Nodes: ${workflow.nodes.length}`);
      
      workflow.nodes.forEach((node, index) => {
        console.log(`${index + 1}. ${node.name} (${node.type})`);
        if (node.typeVersion) {
          console.log(`   Version: ${node.typeVersion}`);
        }
      });
      
      // Analyze node types for error logging capabilities
      console.log('\n💡 Error Logging Capabilities:');
      const hasWebhook = workflow.nodes.some(n => n.type.toLowerCase().includes('webhook'));
      const hasHTTP = workflow.nodes.some(n => n.type.toLowerCase().includes('http'));
      const hasDatabase = workflow.nodes.some(n => 
        n.type.toLowerCase().includes('mysql') || 
        n.type.toLowerCase().includes('postgres') || 
        n.type.toLowerCase().includes('database')
      );
      const hasNotification = workflow.nodes.some(n => 
        n.type.toLowerCase().includes('email') || 
        n.type.toLowerCase().includes('slack') || 
        n.type.toLowerCase().includes('discord')
      );
      
      if (hasWebhook) console.log('✅ Can receive external error reports via webhook');
      if (hasHTTP) console.log('✅ Can make HTTP requests to external systems');
      if (hasDatabase) console.log('✅ Can store errors in database');
      if (hasNotification) console.log('✅ Can send error notifications');
      
    } else {
      console.log('No nodes found in workflow');
    }
    
  } else {
    console.log('No workflow data received');
  }
  
} catch (error) {
  console.log('❌ Error:', error.response?.status, error.message);
  if (error.response?.data) {
    console.log('Error details:', JSON.stringify(error.response.data, null, 2));
  }
}