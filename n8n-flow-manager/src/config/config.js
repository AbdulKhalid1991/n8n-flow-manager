import dotenv from 'dotenv';

dotenv.config();

export const config = {
  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    apiKey: process.env.N8N_API_KEY,
    timeout: 30000
  },
  git: {
    authorName: process.env.GIT_AUTHOR_NAME || 'n8n Flow Manager',
    authorEmail: process.env.GIT_AUTHOR_EMAIL || 'flows@localhost',
    flowsDirectory: './flows',
    backupDirectory: './backups'
  },
  dashboard: {
    port: process.env.DASHBOARD_PORT || 3000,
    host: process.env.DASHBOARD_HOST || 'localhost'
  },
  testing: {
    timeout: parseInt(process.env.TEST_TIMEOUT) || 30000,
    parallelLimit: parseInt(process.env.TEST_PARALLEL_LIMIT) || 5
  },
  enhancement: {
    level: process.env.ENHANCEMENT_LEVEL || 'moderate',
    autoOptimize: process.env.AUTO_OPTIMIZE === 'true'
  }
};