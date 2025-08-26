// Jest setup file for n8n Flow Manager tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.N8N_BASE_URL = 'http://localhost:5678';
process.env.N8N_API_KEY = 'test-api-key';
process.env.GIT_AUTHOR_NAME = 'Test User';
process.env.GIT_AUTHOR_EMAIL = 'test@example.com';
process.env.LOG_LEVEL = 'error'; // Suppress logs during testing

// Mock console methods to avoid noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Keep errors for debugging
};

// Global test timeout
jest.setTimeout(30000);

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});

// Global teardown
afterAll(() => {
  // Clean up any resources
});