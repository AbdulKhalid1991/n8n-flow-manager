import axios from 'axios';
import https from 'https';
import { config } from '../config/config.js';

export class N8nClient {
  constructor() {
    this.baseUrl = config.n8n.baseUrl;
    this.apiKey = config.n8n.apiKey;
    
    // Create HTTPS agent to handle SSL issues
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    
    this.client = axios.create({
      baseURL: `${this.baseUrl}/api/v1`,
      timeout: config.n8n.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.apiKey && { 'X-N8N-API-KEY': this.apiKey })
      },
      httpsAgent: httpsAgent
    });
  }

  async testConnection() {
    try {
      const response = await this.client.get('/workflows');
      return { success: true, message: 'Connected to n8n successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}`,
        error: error.response?.data || error.message
      };
    }
  }

  async getAllWorkflows() {
    try {
      const response = await this.client.get('/workflows');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch workflows: ${error.message}`);
    }
  }

  async getWorkflow(workflowId) {
    try {
      const response = await this.client.get(`/workflows/${workflowId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch workflow ${workflowId}: ${error.message}`);
    }
  }

  async createWorkflow(workflowData) {
    try {
      const response = await this.client.post('/workflows', workflowData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  async updateWorkflow(workflowId, workflowData) {
    try {
      const response = await this.client.put(`/workflows/${workflowId}`, workflowData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update workflow ${workflowId}: ${error.message}`);
    }
  }

  async deleteWorkflow(workflowId) {
    try {
      await this.client.delete(`/workflows/${workflowId}`);
      return { success: true, message: `Workflow ${workflowId} deleted` };
    } catch (error) {
      throw new Error(`Failed to delete workflow ${workflowId}: ${error.message}`);
    }
  }

  async activateWorkflow(workflowId) {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/activate`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to activate workflow ${workflowId}: ${error.message}`);
    }
  }

  async deactivateWorkflow(workflowId) {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/deactivate`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to deactivate workflow ${workflowId}: ${error.message}`);
    }
  }

  async executeWorkflow(workflowId, data = {}) {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/execute`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute workflow ${workflowId}: ${error.message}`);
    }
  }

  async getExecutions(workflowId, options = {}) {
    try {
      const params = new URLSearchParams(options);
      const response = await this.client.get(`/executions?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch executions: ${error.message}`);
    }
  }
}