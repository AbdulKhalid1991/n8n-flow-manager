import https from 'https';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Debugging n8n connection...');
console.log('URL:', process.env.N8N_BASE_URL);
console.log('API Key length:', process.env.N8N_API_KEY.length);
console.log('API Key starts with:', process.env.N8N_API_KEY.substring(0, 20) + '...');

const agent = new https.Agent({
  rejectUnauthorized: false
});

// Test different endpoints and methods
const endpoints = [
  '/api/v1/workflows',
  '/rest/workflows',
  '/webhook-test',
  '/api/v1/executions',
  '/rest/login',
  '/'
];

for (const endpoint of endpoints) {
  console.log(`\n🧪 Testing endpoint: ${endpoint}`);
  
  try {
    const client = axios.create({
      baseURL: process.env.N8N_BASE_URL,
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      httpsAgent: agent,
      timeout: 10000
    });
    
    const response = await client.get(endpoint);
    console.log(`✅ ${endpoint}: Status ${response.status}`);
    
    if (response.data) {
      if (typeof response.data === 'object') {
        console.log(`   Data keys:`, Object.keys(response.data).slice(0, 5));
      } else {
        console.log(`   Response type:`, typeof response.data);
      }
    }
    
  } catch (error) {
    console.log(`❌ ${endpoint}: ${error.response?.status || 'ERROR'} - ${error.response?.data?.message || error.message}`);
  }
}

// Test if it's a JWT token issue
console.log('\n🔐 JWT Token Analysis:');
const parts = process.env.N8N_API_KEY.split('.');
if (parts.length === 3) {
  console.log('✅ Token has 3 parts (valid JWT structure)');
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('Token payload:', {
      sub: payload.sub,
      iss: payload.iss,
      aud: payload.aud,
      iat: new Date(payload.iat * 1000).toISOString()
    });
    
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) {
      console.log('❌ Token is EXPIRED');
    } else if (payload.exp) {
      console.log('✅ Token expires:', new Date(payload.exp * 1000).toISOString());
    } else {
      console.log('ℹ️ Token has no expiration');
    }
    
  } catch (e) {
    console.log('❌ Could not decode JWT payload');
  }
} else {
  console.log('❌ Token does not appear to be a JWT');
}