import { EnvironmentValidator } from '../../src/config/environmentValidator.js';
import fs from 'fs';

// Mock fs
jest.mock('fs');

describe('EnvironmentValidator', () => {
  let validator;
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Clear mocks
    jest.clearAllMocks();
    
    // Create validator instance
    validator = new EnvironmentValidator();
    
    // Mock fs.existsSync by default
    fs.existsSync.mockReturnValue(true);
    fs.writeFileSync.mockImplementation(() => {});
    fs.unlinkSync.mockImplementation(() => {});
    fs.mkdirSync.mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should create EnvironmentValidator instance', () => {
      expect(validator).toBeInstanceOf(EnvironmentValidator);
      expect(validator.requiredVariables).toEqual(['N8N_BASE_URL', 'N8N_API_KEY']);
      expect(validator.recommendedVariables).toEqual(['GIT_AUTHOR_NAME', 'GIT_AUTHOR_EMAIL', 'LOG_LEVEL']);
    });
  });

  describe('checkEnvFile', () => {
    it('should not report error when .env exists', () => {
      fs.existsSync.mockReturnValue(true);
      
      validator.checkEnvFile();
      
      expect(validator.validationErrors).toHaveLength(0);
    });

    it('should report error when .env missing but .env.example exists', () => {
      fs.existsSync.mockImplementation((path) => path.includes('.env.example'));
      
      validator.checkEnvFile();
      
      expect(validator.validationErrors).toHaveLength(1);
      expect(validator.validationErrors[0].type).toBe('missing_env_file');
      expect(validator.validationErrors[0].command).toBe('cp .env.example .env');
    });

    it('should report error when both .env and .env.example are missing', () => {
      fs.existsSync.mockReturnValue(false);
      
      validator.checkEnvFile();
      
      expect(validator.validationErrors).toHaveLength(1);
      expect(validator.validationErrors[0].type).toBe('missing_env_files');
    });
  });

  describe('validateRequiredVariables', () => {
    it('should pass validation when all required variables are set', () => {
      process.env.N8N_BASE_URL = 'http://localhost:5678';
      process.env.N8N_API_KEY = 'valid-api-key';
      
      validator.validateRequiredVariables();
      
      expect(validator.validationErrors).toHaveLength(0);
    });

    it('should report error for missing required variables', () => {
      delete process.env.N8N_BASE_URL;
      delete process.env.N8N_API_KEY;
      
      validator.validateRequiredVariables();
      
      expect(validator.validationErrors).toHaveLength(2);
      expect(validator.validationErrors[0].type).toBe('missing_required_variable');
      expect(validator.validationErrors[1].type).toBe('missing_required_variable');
    });

    it('should report error for empty required variables', () => {
      process.env.N8N_BASE_URL = '';
      process.env.N8N_API_KEY = '   ';
      
      validator.validateRequiredVariables();
      
      expect(validator.validationErrors).toHaveLength(2);
      expect(validator.validationErrors[0].type).toBe('empty_required_variable');
      expect(validator.validationErrors[1].type).toBe('empty_required_variable');
    });
  });

  describe('validateSpecificVariable', () => {
    it('should validate N8N_BASE_URL format', () => {
      validator.validateSpecificVariable('N8N_BASE_URL', 'invalid-url');
      
      expect(validator.validationErrors).toHaveLength(1);
      expect(validator.validationErrors[0].type).toBe('invalid_url');
    });

    it('should accept valid URLs', () => {
      validator.validateSpecificVariable('N8N_BASE_URL', 'http://localhost:5678');
      validator.validateSpecificVariable('N8N_BASE_URL', 'https://n8n.example.com');
      
      expect(validator.validationErrors).toHaveLength(0);
    });

    it('should warn about suspicious API keys', () => {
      validator.validateSpecificVariable('N8N_API_KEY', 'short');
      
      expect(validator.validationWarnings).toHaveLength(1);
      expect(validator.validationWarnings[0].type).toBe('suspicious_api_key');
    });

    it('should accept long API keys', () => {
      validator.validateSpecificVariable('N8N_API_KEY', 'long-valid-api-key-123456');
      
      expect(validator.validationWarnings).toHaveLength(0);
    });
  });

  describe('validateRecommendedVariables', () => {
    it('should warn about missing recommended variables', () => {
      delete process.env.GIT_AUTHOR_NAME;
      delete process.env.GIT_AUTHOR_EMAIL;
      delete process.env.LOG_LEVEL;
      
      validator.validateRecommendedVariables();
      
      expect(validator.validationWarnings).toHaveLength(3);
      expect(validator.validationWarnings.every(w => w.type === 'missing_recommended_variable')).toBe(true);
    });

    it('should not warn when recommended variables are set', () => {
      process.env.GIT_AUTHOR_NAME = 'Test User';
      process.env.GIT_AUTHOR_EMAIL = 'test@example.com';
      process.env.LOG_LEVEL = 'info';
      
      validator.validateRecommendedVariables();
      
      expect(validator.validationWarnings).toHaveLength(0);
    });
  });

  describe('validateDirectories', () => {
    it('should create missing directories', () => {
      fs.existsSync.mockReturnValue(false);
      
      validator.validateDirectories();
      
      expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2); // Test files
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2); // Clean up test files
    });

    it('should handle directory creation errors', () => {
      fs.existsSync.mockReturnValue(false);
      fs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      validator.validateDirectories();
      
      expect(validator.validationErrors).toHaveLength(2);
      expect(validator.validationErrors.every(e => e.type === 'directory_permission_error')).toBe(true);
    });

    it('should test write permissions for existing directories', () => {
      fs.existsSync.mockReturnValue(true);
      
      validator.validateDirectories();
      
      expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
      expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(validator.isValidUrl('http://localhost:5678')).toBe(true);
      expect(validator.isValidUrl('https://n8n.example.com')).toBe(true);
      expect(validator.isValidUrl('https://example.com:3000/path')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validator.isValidUrl('invalid-url')).toBe(false);
      expect(validator.isValidUrl('localhost:5678')).toBe(false);
      expect(validator.isValidUrl('')).toBe(false);
    });
  });

  describe('getValidationReport', () => {
    it('should generate successful report with no issues', () => {
      const report = validator.getValidationReport();
      
      expect(report.success).toBe(true);
      expect(report.ready).toBe(true);
      expect(report.errors).toHaveLength(0);
      expect(report.warnings).toHaveLength(0);
      expect(report.summary.totalErrors).toBe(0);
      expect(report.summary.totalWarnings).toBe(0);
    });

    it('should generate failure report with errors', () => {
      validator.validationErrors.push({
        type: 'missing_required_variable',
        message: 'Test error'
      });
      
      const report = validator.getValidationReport();
      
      expect(report.success).toBe(false);
      expect(report.ready).toBe(false);
      expect(report.errors).toHaveLength(1);
      expect(report.summary.totalErrors).toBe(1);
    });

    it('should generate report with warnings only', () => {
      validator.validationWarnings.push({
        type: 'missing_recommended_variable',
        message: 'Test warning'
      });
      
      const report = validator.getValidationReport();
      
      expect(report.success).toBe(true);
      expect(report.ready).toBe(false);
      expect(report.warnings).toHaveLength(1);
      expect(report.summary.totalWarnings).toBe(1);
    });

    it('should include setup instructions when issues exist', () => {
      validator.validationErrors.push({
        type: 'missing_env_file',
        message: 'Test error'
      });
      
      const report = validator.getValidationReport();
      
      expect(report.setupInstructions).toBeDefined();
      expect(report.setupInstructions).toHaveLength(1);
      expect(report.setupInstructions[0].step).toBe(1);
    });
  });

  describe('autoFix', () => {
    it('should create .env from .env.example', async () => {
      fs.existsSync.mockImplementation(path => path.includes('.env.example'));
      fs.copyFileSync.mockImplementation(() => {});
      
      const result = await validator.autoFix();
      
      expect(result.success).toBe(true);
      expect(result.fixes).toContain('Created .env file from .env.example');
      expect(fs.copyFileSync).toHaveBeenCalled();
    });

    it('should create missing directories', async () => {
      fs.existsSync.mockImplementation(path => !path.includes('flows') && !path.includes('backups'));
      
      const result = await validator.autoFix();
      
      expect(result.success).toBe(true);
      expect(result.fixes.length).toBeGreaterThan(0);
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      fs.existsSync.mockImplementation(path => path.includes('.env.example'));
      fs.copyFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = await validator.autoFix();
      
      expect(result.success).toBe(false);
      expect(result.fixes).toHaveLength(0);
    });
  });
});