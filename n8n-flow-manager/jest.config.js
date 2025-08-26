export default {
  // Test environment
  testEnvironment: 'node',
  
  // ES modules support
  extensionsToTreatAsEsm: ['.js'],
  transform: {},
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Test file patterns
  testMatch: [
    '**/test/**/*.test.js',
    '**/src/**/*.test.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Collect coverage on all files
  collectCoverage: false // Set to true when running coverage
};