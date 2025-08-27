import https from 'https';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔐 Testing different authentication methods...');

const agent = new https.Agent({
  rejectUnauthorized: false
});

// Test 1: Current API key in header
console.log('\n🧪 Test 1: API Key in X-N8N-API-KEY header');
try {
  const client1 = axios.create({
    baseURL: process.env.N8N_BASE_URL,
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY
    },
    httpsAgent: agent,
    timeout: 10000
  });
  
  const response1 = await client1.get('/api/v1/workflows');
  console.log('✅ Success with X-N8N-API-KEY header');
  console.log('Workflows:', response1.data.data?.length || 0);
} catch (error) {
  console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
}

// Test 2: API key in Authorization header
console.log('\n🧪 Test 2: API Key in Authorization header');
try {
  const client2 = axios.create({
    baseURL: process.env.N8N_BASE_URL,
    headers: {
      'Authorization': `Bearer ${process.env.N8N_API_KEY}`
    },
    httpsAgent: agent,
    timeout: 10000
  });
  
  const response2 = await client2.get('/api/v1/workflows');
  console.log('✅ Success with Authorization Bearer');
  console.log('Workflows:', response2.data.data?.length || 0);
} catch (error) {
  console.log('❌ Failed:', error.response?.status, error.response?.data?.message || error.message);
}

// Test 3: Check if API endpoint exists
console.log('\n🧪 Test 3: Check API endpoint');
try {
  const client3 = axios.create({
    baseURL: process.env.N8N_BASE_URL,
    httpsAgent: agent,
    timeout: 10000
  });
  
  const response3 = await client3.get('/api/v1/');
  console.log('✅ API endpoint accessible');
  console.log('Response:', response3.status);
} catch (error) {
  console.log('❌ API endpoint failed:', error.response?.status, error.message);
}

console.log('\n💡 Suggestions:');
console.log('1. Check if your API key is valid and not expired');
console.log('2. Verify the n8n instance is running and accessible');
console.log('3. Generate a new API key from n8n Settings > API Keys');
console.log('4. Make sure the API key has the right permissions');