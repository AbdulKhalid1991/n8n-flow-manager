import { FlowManager } from '../../src/core/flowManager.js';
import { N8nClient } from '../../src/api/n8nClient.js';
import fs from 'fs/promises';

// Mock dependencies
jest.mock('../../src/api/n8nClient.js');
jest.mock('fs/promises');
jest.mock('../../src/core/gitManager.js');

describe('FlowManager', () => {
  let flowManager;
  let mockN8nClient;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create FlowManager instance
    flowManager = new FlowManager();
    
    // Mock N8nClient
    mockN8nClient = {
      getWorkflow: jest.fn(),
      getAllWorkflows: jest.fn(),
      createWorkflow: jest.fn(),
      updateWorkflow: jest.fn()
    };
    
    flowManager.n8nClient = mockN8nClient;
    flowManager.gitManager = {
      initialize: jest.fn().mockResolvedValue(true),
      commitFlow: jest.fn().mockResolvedValue({ success: true })
    };
  });

  describe('constructor', () => {
    it('should create FlowManager instance', () => {
      const manager = new FlowManager();
      expect(manager).toBeInstanceOf(FlowManager);
      expect(manager.flowsDirectory).toBe('./flows');
      expect(manager.backupDirectory).toBe('./backups');
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize invalid characters from filename', () => {
      const result = flowManager.sanitizeFileName('My Workflow!@#.json');
      expect(result).toBe('my_workflow___.json');
    });

    it('should handle empty filename', () => {
      const result = flowManager.sanitizeFileName('');
      expect(result).toBe('');
    });

    it('should preserve valid characters', () => {
      const result = flowManager.sanitizeFileName('valid-workflow_123.json');
      expect(result).toBe('valid-workflow_123.json');
    });
  });

  describe('generateVersion', () => {
    it('should generate version string', () => {
      const version = flowManager.generateVersion();
      expect(version).toMatch(/^v\d+$/);
    });

    it('should generate different versions on subsequent calls', () => {
      const version1 = flowManager.generateVersion();
      const version2 = flowManager.generateVersion();
      expect(version1).not.toBe(version2);
    });
  });

  describe('exportWorkflow', () => {
    beforeEach(() => {
      // Mock fs operations
      fs.access = jest.fn().mockResolvedValue(true);
      fs.mkdir = jest.fn().mockResolvedValue(true);
      fs.writeFile = jest.fn().mockResolvedValue(true);
    });

    it('should export workflow successfully', async () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        nodes: [],
        connections: {}
      };

      mockN8nClient.getWorkflow.mockResolvedValue(mockWorkflow);

      const result = await flowManager.exportWorkflow('test-workflow');

      expect(result.success).toBe(true);
      expect(result.filePath).toContain('test_workflow.json');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should handle export errors gracefully', async () => {
      mockN8nClient.getWorkflow.mockRejectedValue(new Error('Network error'));

      const result = await flowManager.exportWorkflow('test-workflow');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should include export metadata', async () => {
      const mockWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow'
      };

      mockN8nClient.getWorkflow.mockResolvedValue(mockWorkflow);

      await flowManager.exportWorkflow('test-workflow');

      const writeCall = fs.writeFile.mock.calls[0];
      const exportData = JSON.parse(writeCall[1]);

      expect(exportData.exportedAt).toBeDefined();
      expect(exportData.exportedBy).toBe('n8n-flow-manager');
      expect(exportData.version).toMatch(/^v\d+$/);
    });
  });

  describe('exportAllWorkflows', () => {
    beforeEach(() => {
      fs.access = jest.fn().mockResolvedValue(true);
      fs.mkdir = jest.fn().mockResolvedValue(true);
      fs.writeFile = jest.fn().mockResolvedValue(true);
    });

    it('should export multiple workflows', async () => {
      const mockWorkflows = [
        { id: 'workflow-1', name: 'Workflow 1' },
        { id: 'workflow-2', name: 'Workflow 2' }
      ];

      mockN8nClient.getAllWorkflows.mockResolvedValue(mockWorkflows);
      mockN8nClient.getWorkflow.mockImplementation((id) => 
        Promise.resolve(mockWorkflows.find(w => w.id === id))
      );

      const result = await flowManager.exportAllWorkflows();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results.every(r => r.success)).toBe(true);
    });

    it('should handle partial failures', async () => {
      const mockWorkflows = [
        { id: 'workflow-1', name: 'Workflow 1' },
        { id: 'workflow-2', name: 'Workflow 2' }
      ];

      mockN8nClient.getAllWorkflows.mockResolvedValue(mockWorkflows);
      mockN8nClient.getWorkflow.mockImplementation((id) => {
        if (id === 'workflow-2') {
          return Promise.reject(new Error('Export failed'));
        }
        return Promise.resolve(mockWorkflows.find(w => w.id === id));
      });

      const result = await flowManager.exportAllWorkflows();

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results.filter(r => r.success)).toHaveLength(1);
      expect(result.results.filter(r => !r.success)).toHaveLength(1);
    });
  });

  describe('cleanWorkflowForImport', () => {
    it('should remove export metadata', () => {
      const workflowData = {
        id: 'test-workflow',
        name: 'Test Workflow',
        exportedAt: '2023-01-01T00:00:00Z',
        exportedBy: 'n8n-flow-manager',
        version: 'v123',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: []
      };

      const cleaned = flowManager.cleanWorkflowForImport(workflowData);

      expect(cleaned.exportedAt).toBeUndefined();
      expect(cleaned.exportedBy).toBeUndefined();
      expect(cleaned.version).toBeUndefined();
      expect(cleaned.createdAt).toBeUndefined();
      expect(cleaned.updatedAt).toBeUndefined();
      expect(cleaned.id).toBe('test-workflow');
      expect(cleaned.name).toBe('Test Workflow');
      expect(cleaned.nodes).toEqual([]);
    });
  });

  describe('findDifferences', () => {
    it('should detect name differences', () => {
      const local = { name: 'Local Name', nodes: [], connections: {} };
      const remote = { name: 'Remote Name', nodes: [], connections: {} };

      const differences = flowManager.findDifferences(local, remote);

      expect(differences).toHaveLength(1);
      expect(differences[0]).toEqual({
        field: 'name',
        local: 'Local Name',
        remote: 'Remote Name'
      });
    });

    it('should detect structure changes', () => {
      const local = { 
        name: 'Same Name', 
        nodes: [{ id: 1 }], 
        connections: {} 
      };
      const remote = { 
        name: 'Same Name', 
        nodes: [{ id: 2 }], 
        connections: {} 
      };

      const differences = flowManager.findDifferences(local, remote);

      expect(differences).toHaveLength(1);
      expect(differences[0].field).toBe('nodes');
      expect(differences[0].type).toBe('structure_change');
    });

    it('should return empty array for identical workflows', () => {
      const workflow = { 
        name: 'Same Name', 
        nodes: [{ id: 1 }], 
        connections: {} 
      };

      const differences = flowManager.findDifferences(workflow, workflow);

      expect(differences).toHaveLength(0);
    });
  });
});