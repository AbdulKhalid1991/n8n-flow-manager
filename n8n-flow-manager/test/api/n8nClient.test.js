import { N8nClient } from '../../src/api/n8nClient.js';
import axios from 'axios';

// Mock axios
jest.mock('axios');

describe('N8nClient', () => {
  let n8nClient;
  let mockAxiosInstance;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock axios.create
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    };

    axios.create.mockReturnValue(mockAxiosInstance);

    // Create N8nClient instance
    n8nClient = new N8nClient();
  });

  describe('constructor', () => {
    it('should create N8nClient instance with correct configuration', () => {
      expect(n8nClient).toBeInstanceOf(N8nClient);
      expect(n8nClient.baseUrl).toBe('http://localhost:5678');
      expect(n8nClient.apiKey).toBe('test-api-key');
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:5678/rest',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': 'test-api-key'
        }
      });
    });

    it('should handle missing API key', () => {
      // Temporarily remove API key
      delete process.env.N8N_API_KEY;
      
      const clientWithoutKey = new N8nClient();
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:5678/rest',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Restore API key
      process.env.N8N_API_KEY = 'test-api-key';
    });
  });

  describe('testConnection', () => {
    it('should return success for valid connection', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      const result = await n8nClient.testConnection();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Connected to n8n successfully');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows');
    });

    it('should return failure for invalid connection', async () => {
      const error = new Error('Connection failed');
      error.response = { data: { message: 'Unauthorized' } };
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await n8nClient.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection failed: Connection failed');
      expect(result.error).toEqual({ message: 'Unauthorized' });
    });

    it('should handle network errors', async () => {
      const error = new Error('Network Error');
      mockAxiosInstance.get.mockRejectedValue(error);

      const result = await n8nClient.testConnection();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Connection failed: Network Error');
      expect(result.error).toBe('Network Error');
    });
  });

  describe('getAllWorkflows', () => {
    it('should fetch all workflows successfully', async () => {
      const mockWorkflows = [
        { id: 'wf1', name: 'Workflow 1' },
        { id: 'wf2', name: 'Workflow 2' }
      ];
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockWorkflows });

      const result = await n8nClient.getAllWorkflows();

      expect(result).toEqual(mockWorkflows);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows');
    });

    it('should throw error on API failure', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      await expect(n8nClient.getAllWorkflows()).rejects.toThrow('Failed to fetch workflows: API Error');
    });
  });

  describe('getWorkflow', () => {
    it('should fetch specific workflow successfully', async () => {
      const mockWorkflow = { id: 'wf1', name: 'Workflow 1', nodes: [] };
      
      mockAxiosInstance.get.mockResolvedValue({ data: mockWorkflow });

      const result = await n8nClient.getWorkflow('wf1');

      expect(result).toEqual(mockWorkflow);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/workflows/wf1');
    });

    it('should throw error for non-existent workflow', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Workflow not found'));

      await expect(n8nClient.getWorkflow('nonexistent')).rejects.toThrow('Failed to fetch workflow nonexistent: Workflow not found');
    });
  });

  describe('createWorkflow', () => {
    it('should create workflow successfully', async () => {
      const workflowData = { name: 'New Workflow', nodes: [] };
      const createdWorkflow = { id: 'new-wf', ...workflowData };
      
      mockAxiosInstance.post.mockResolvedValue({ data: createdWorkflow });

      const result = await n8nClient.createWorkflow(workflowData);

      expect(result).toEqual(createdWorkflow);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/workflows', workflowData);
    });

    it('should throw error on creation failure', async () => {
      const workflowData = { name: 'Invalid Workflow' };
      mockAxiosInstance.post.mockRejectedValue(new Error('Validation failed'));

      await expect(n8nClient.createWorkflow(workflowData)).rejects.toThrow('Failed to create workflow: Validation failed');
    });
  });

  describe('updateWorkflow', () => {
    it('should update workflow successfully', async () => {
      const workflowData = { name: 'Updated Workflow', nodes: [] };
      const updatedWorkflow = { id: 'wf1', ...workflowData };
      
      mockAxiosInstance.put.mockResolvedValue({ data: updatedWorkflow });

      const result = await n8nClient.updateWorkflow('wf1', workflowData);

      expect(result).toEqual(updatedWorkflow);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/workflows/wf1', workflowData);
    });

    it('should throw error on update failure', async () => {
      const workflowData = { name: 'Invalid Update' };
      mockAxiosInstance.put.mockRejectedValue(new Error('Update failed'));

      await expect(n8nClient.updateWorkflow('wf1', workflowData)).rejects.toThrow('Failed to update workflow wf1: Update failed');
    });
  });

  describe('deleteWorkflow', () => {
    it('should delete workflow successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({});

      const result = await n8nClient.deleteWorkflow('wf1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Workflow wf1 deleted');
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/workflows/wf1');
    });

    it('should throw error on deletion failure', async () => {
      mockAxiosInstance.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(n8nClient.deleteWorkflow('wf1')).rejects.toThrow('Failed to delete workflow wf1: Deletion failed');
    });
  });

  describe('executeWorkflow', () => {
    it('should execute workflow successfully', async () => {
      const executionResult = { id: 'exec1', status: 'success' };
      
      mockAxiosInstance.post.mockResolvedValue({ data: executionResult });

      const result = await n8nClient.executeWorkflow('wf1', { input: 'data' });

      expect(result).toEqual(executionResult);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/workflows/wf1/execute', { input: 'data' });
    });

    it('should execute workflow with empty data', async () => {
      const executionResult = { id: 'exec2', status: 'success' };
      
      mockAxiosInstance.post.mockResolvedValue({ data: executionResult });

      const result = await n8nClient.executeWorkflow('wf1');

      expect(result).toEqual(executionResult);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/workflows/wf1/execute', {});
    });

    it('should throw error on execution failure', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Execution failed'));

      await expect(n8nClient.executeWorkflow('wf1')).rejects.toThrow('Failed to execute workflow wf1: Execution failed');
    });
  });

  describe('activateWorkflow', () => {
    it('should activate workflow successfully', async () => {
      const activatedWorkflow = { id: 'wf1', active: true };
      
      mockAxiosInstance.post.mockResolvedValue({ data: activatedWorkflow });

      const result = await n8nClient.activateWorkflow('wf1');

      expect(result).toEqual(activatedWorkflow);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/workflows/wf1/activate');
    });

    it('should throw error on activation failure', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Activation failed'));

      await expect(n8nClient.activateWorkflow('wf1')).rejects.toThrow('Failed to activate workflow wf1: Activation failed');
    });
  });

  describe('deactivateWorkflow', () => {
    it('should deactivate workflow successfully', async () => {
      const deactivatedWorkflow = { id: 'wf1', active: false };
      
      mockAxiosInstance.post.mockResolvedValue({ data: deactivatedWorkflow });

      const result = await n8nClient.deactivateWorkflow('wf1');

      expect(result).toEqual(deactivatedWorkflow);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/workflows/wf1/deactivate');
    });

    it('should throw error on deactivation failure', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Deactivation failed'));

      await expect(n8nClient.deactivateWorkflow('wf1')).rejects.toThrow('Failed to deactivate workflow wf1: Deactivation failed');
    });
  });
});