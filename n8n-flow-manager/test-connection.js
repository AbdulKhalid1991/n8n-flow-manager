import https from 'https';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔗 Testing n8n connection...');
console.log('URL:', process.env.N8N_BASE_URL);
console.log('API Key:', process.env.N8N_API_KEY ? 'Present' : 'Missing');

const agent = new https.Agent({
  rejectUnauthorized: false
});

const client = axios.create({
  baseURL: process.env.N8N_BASE_URL,
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY
  },
  httpsAgent: agent,
  timeout: 10000
});

try {
  console.log('\n📡 Making API request...');
  const response = await client.get('/api/v1/workflows');
  console.log('✅ Connection successful!');
  console.log('Status:', response.status);
  console.log('Workflows found:', response.data.data?.length || 0);
  
  if (response.data.data?.length > 0) {
    console.log('\n📋 Available workflows:');
    response.data.data.slice(0, 5).forEach(workflow => {
      console.log(`  - ${workflow.name} (${workflow.id}) - Active: ${workflow.active}`);
    });
  }
  
} catch (error) {
  console.log('❌ Connection failed');
  console.log('Status:', error.response?.status);
  console.log('Message:', error.message);
  if (error.response?.data) {
    console.log('Error details:', error.response.data);
  }
}