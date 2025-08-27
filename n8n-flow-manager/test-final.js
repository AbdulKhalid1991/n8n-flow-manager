import https from 'https';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Final connection test with different approaches...');

const agent = new https.Agent({
  rejectUnauthorized: false
});

// Approach 1: Standard API key
console.log('\n🔑 Approach 1: Standard X-N8N-API-KEY');
try {
  const response1 = await axios({
    method: 'GET',
    url: `${process.env.N8N_BASE_URL}/api/v1/workflows`,
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY
    },
    httpsAgent: agent
  });
  console.log('✅ Success!', response1.data?.data?.length || 0, 'workflows found');
} catch (error) {
  console.log('❌ Failed:', error.response?.status, error.response?.statusText);
}

// Approach 2: With proper user agent
console.log('\n🔑 Approach 2: With User-Agent header');
try {
  const response2 = await axios({
    method: 'GET',
    url: `${process.env.N8N_BASE_URL}/api/v1/workflows`,
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY,
      'User-Agent': 'n8n-flow-manager/1.0.0',
      'Accept': 'application/json'
    },
    httpsAgent: agent
  });
  console.log('✅ Success!', response2.data?.data?.length || 0, 'workflows found');
} catch (error) {
  console.log('❌ Failed:', error.response?.status, error.response?.statusText);
}

// Approach 3: Try the older REST endpoint
console.log('\n🔑 Approach 3: REST endpoint with credentials');
try {
  const response3 = await axios({
    method: 'GET',
    url: `${process.env.N8N_BASE_URL}/rest/workflows`,
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY,
      'cookie': 'n8n-auth=' + process.env.N8N_API_KEY
    },
    httpsAgent: agent
  });
  console.log('✅ Success!', response3.data?.length || 0, 'workflows found');
} catch (error) {
  console.log('❌ Failed:', error.response?.status, error.response?.statusText);
}

console.log('\n💡 If all approaches fail, the API key likely needs to be regenerated from your n8n instance.');
console.log('Go to: Settings → API Keys → Create new API key');