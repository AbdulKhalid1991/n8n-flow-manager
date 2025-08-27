import fs from 'fs/promises';
import path from 'path';
import { EnhancementAgent } from './enhancementAgent.js';

export class ImprovementExecutor {
  constructor() {
    this.enhancementAgent = new EnhancementAgent();
    this.projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
  }

  async executeImprovements(options = {}) {
    const { autoApply = false, priority = 'high', dryRun = true } = options;
    
    console.log('🔧 Improvement Executor: Analyzing project for enhancements...');
    
    const analysis = await this.enhancementAgent.analyzeProject();
    
    if (!analysis.success) {
      return analysis;
    }

    const applicableImprovements = this.filterApplicableImprovements(
      analysis.recommendations, 
      priority
    );

    const executionPlan = this.createExecutionPlan(applicableImprovements);
    
    if (dryRun) {
      return this.generateDryRunReport(executionPlan, analysis);
    }

    if (autoApply) {
      return await this.applyImprovements(executionPlan);
    }

    return {
      success: true,
      analysis,
      executionPlan,
      message: 'Analysis complete. Use --apply to execute improvements.'
    };
  }

  filterApplicableImprovements(recommendations, priorityFilter) {
    const priorityOrder = ['IMMEDIATE', 'HIGH', 'MEDIUM', 'LOW'];
    const maxPriorityIndex = priorityOrder.indexOf(priorityFilter.toUpperCase());
    
    return recommendations.filter((rec, index) => index <= maxPriorityIndex);
  }

  createExecutionPlan(recommendations) {
    const executionPlan = {
      phases: [],
      estimatedTime: '0 hours',
      totalTasks: 0
    };

    recommendations.forEach(recommendation => {
      const phase = {
        priority: recommendation.priority,
        title: recommendation.title,
        tasks: this.createTasksFromRecommendation(recommendation),
        estimatedTime: recommendation.estimatedEffort
      };
      
      executionPlan.phases.push(phase);
      executionPlan.totalTasks += phase.tasks.length;
    });

    return executionPlan;
  }

  createTasksFromRecommendation(recommendation) {
    const tasks = [];

    recommendation.items.forEach(item => {
      switch (item.type) {
        case 'missing_env_example':
          tasks.push({
            id: `create_env_example_${Date.now()}`,
            type: 'file_creation',
            description: 'Create .env.example file',
            action: 'createEnvExample',
            automated: true,
            files: ['.env.example']
          });
          break;

        case 'missing_error_handling':
          tasks.push({
            id: `add_error_handling_${Date.now()}`,
            type: 'code_enhancement',
            description: 'Add comprehensive error handling',
            action: 'addErrorHandling',
            automated: true,
            files: item.files
          });
          break;

        case 'console_logging':
          tasks.push({
            id: `replace_console_logging_${Date.now()}`,
            type: 'code_enhancement',
            description: 'Replace console statements with proper logging',
            action: 'replaceConsoleLogging',
            automated: true,
            files: item.files
          });
          break;

        case 'hardcoded_secrets':
          tasks.push({
            id: `fix_hardcoded_secrets_${Date.now()}`,
            type: 'security_fix',
            description: 'Move hardcoded secrets to environment variables',
            action: 'fixHardcodedSecrets',
            automated: false, // Requires manual review
            files: item.files
          });
          break;

        case 'missing_tests':
          tasks.push({
            id: `create_test_suite_${Date.now()}`,
            type: 'testing_setup',
            description: 'Set up comprehensive test suite',
            action: 'createTestSuite',
            automated: true,
            files: ['test/']
          });
          break;

        case 'sync_in_async':
          tasks.push({
            id: `fix_sync_operations_${Date.now()}`,
            type: 'performance_fix',
            description: 'Replace synchronous operations with async alternatives',
            action: 'fixSyncOperations',
            automated: true,
            files: item.files
          });
          break;

        case 'sequential_operations':
          tasks.push({
            id: `optimize_parallel_operations_${Date.now()}`,
            type: 'performance_fix',
            description: 'Optimize sequential operations for parallel execution',
            action: 'optimizeParallelOperations',
            automated: true,
            files: item.files
          });
          break;

        default:
          tasks.push({
            id: `generic_improvement_${Date.now()}`,
            type: 'manual_review',
            description: item.description,
            action: 'manualReview',
            automated: false,
            files: item.files
          });
      }
    });

    return tasks;
  }

  async applyImprovements(executionPlan) {
    const results = {
      success: true,
      completedTasks: [],
      failedTasks: [],
      skippedTasks: []
    };

    console.log('🚀 Starting automated improvements...');

    for (const phase of executionPlan.phases) {
      console.log(`\n📋 Phase: ${phase.title}`);
      
      for (const task of phase.tasks) {
        try {
          if (!task.automated) {
            console.log(`⏭️  Skipping manual task: ${task.description}`);
            results.skippedTasks.push(task);
            continue;
          }

          console.log(`🔨 Executing: ${task.description}`);
          const result = await this.executeTask(task);
          
          if (result.success) {
            console.log(`✅ Completed: ${task.description}`);
            results.completedTasks.push({ ...task, result });
          } else {
            console.log(`❌ Failed: ${task.description} - ${result.error}`);
            results.failedTasks.push({ ...task, error: result.error });
          }
        } catch (error) {
          console.log(`❌ Error executing task: ${task.description} - ${error.message}`);
          results.failedTasks.push({ ...task, error: error.message });
        }
      }
    }

    return results;
  }

  async executeTask(task) {
    switch (task.action) {
      case 'createEnvExample':
        return await this.createEnvExample();
      case 'addErrorHandling':
        return await this.addErrorHandling(task.files);
      case 'replaceConsoleLogging':
        return await this.replaceConsoleLogging(task.files);
      case 'createTestSuite':
        return await this.createTestSuite();
      case 'fixSyncOperations':
        return await this.fixSyncOperations(task.files);
      case 'optimizeParallelOperations':
        return await this.optimizeParallelOperations(task.files);
      default:
        return { success: false, error: `Unknown task action: ${task.action}` };
    }
  }

  async createEnvExample() {
    try {
      const envExampleContent = `# n8n Flow Manager Configuration

# n8n Instance Configuration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_api_key_here

# Git Configuration  
GIT_AUTHOR_NAME=n8n Flow Manager
GIT_AUTHOR_EMAIL=flows@your-domain.com

# Dashboard Configuration
DASHBOARD_PORT=3000
DASHBOARD_HOST=localhost

# Testing Configuration
TEST_TIMEOUT=30000
TEST_PARALLEL_LIMIT=5

# Enhancement Settings
ENHANCEMENT_LEVEL=moderate
AUTO_OPTIMIZE=false

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json

# Security Settings
SECURE_CREDENTIALS=true
ENCRYPTION_KEY=generate_random_key_here
`;

      const envExamplePath = path.join(this.projectRoot, '.env.example');
      await fs.writeFile(envExamplePath, envExampleContent);
      
      return {
        success: true,
        message: 'Created .env.example file',
        files: ['.env.example']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async addErrorHandling(files) {
    try {
      let modifiedFiles = 0;
      
      for (const file of files || []) {
        const filePath = path.join(this.projectRoot, file);
        
        try {
          let content = await fs.readFile(filePath, 'utf8');
          let modified = false;
          
          // Add error handling to async functions without try-catch
          const asyncFunctionRegex = /async\s+function[^{]+{[^}]*await[^}]*}/g;
          content = content.replace(asyncFunctionRegex, (match) => {
            if (!match.includes('try') && !match.includes('catch')) {
              const functionBody = match.match(/{([\s\S]*)}/)[1];
              const newFunctionBody = `{
    try {${functionBody}
    } catch (error) {
      console.error('Error in function:', error.message);
      throw error;
    }
  }`;
              modified = true;
              return match.replace(/{[\s\S]*}/, newFunctionBody);
            }
            return match;
          });
          
          // Add error handling to Promise chains
          content = content.replace(/\.then\([^)]+\)(?!\s*\.catch)/g, (match) => {
            modified = true;
            return match + '\n    .catch(error => { console.error(\'Promise error:\', error); throw error; })';
          });
          
          if (modified) {
            await fs.writeFile(filePath, content);
            modifiedFiles++;
          }
        } catch (fileError) {
          console.log(`Could not process file ${file}: ${fileError.message}`);
        }
      }
      
      return {
        success: true,
        message: `Added error handling to ${modifiedFiles} files`,
        modifiedFiles
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async replaceConsoleLogging(files) {
    try {
      // First create a logging utility
      const loggingUtilContent = `import chalk from 'chalk';

export class Logger {
  constructor(module = 'n8n-flow-manager') {
    this.module = module;
  }

  info(message, ...args) {
    console.log(chalk.blue(\`[\${this.module}] INFO:\`), message, ...args);
  }

  error(message, ...args) {
    console.error(chalk.red(\`[\${this.module}] ERROR:\`), message, ...args);
  }

  warn(message, ...args) {
    console.warn(chalk.yellow(\`[\${this.module}] WARN:\`), message, ...args);
  }

  debug(message, ...args) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(chalk.gray(\`[\${this.module}] DEBUG:\`), message, ...args);
    }
  }

  success(message, ...args) {
    console.log(chalk.green(\`[\${this.module}] SUCCESS:\`), message, ...args);
  }
}

const executorLogger = new Logger();
export { executorLogger as logger };
`;

      const utilsDir = path.join(this.projectRoot, 'src/utils');
      await fs.mkdir(utilsDir, { recursive: true });
      await fs.writeFile(path.join(utilsDir, 'logger.js'), loggingUtilContent);

      let modifiedFiles = 0;
      
      for (const file of files || []) {
        const filePath = path.join(this.projectRoot, file);
        
        try {
          let content = await fs.readFile(filePath, 'utf8');
          let modified = false;
          
          // Add logger import if not present and console statements exist
          if (content.includes('console.') && !content.includes('from \'../utils/logger.js\'')) {
            const importStatement = "import { logger } from '../utils/logger.js';\n";
            content = importStatement + content;
            modified = true;
          }
          
          // Replace console statements
          content = content.replace(/console\.log\(/g, 'logger.info(');
          content = content.replace(/console\.error\(/g, 'logger.error(');
          content = content.replace(/console\.warn\(/g, 'logger.warn(');
          content = content.replace(/console\.info\(/g, 'logger.info(');
          
          if (modified || content !== await fs.readFile(filePath, 'utf8')) {
            await fs.writeFile(filePath, content);
            modifiedFiles++;
          }
        } catch (fileError) {
          console.log(`Could not process file ${file}: ${fileError.message}`);
        }
      }
      
      return {
        success: true,
        message: `Replaced console logging in ${modifiedFiles} files`,
        modifiedFiles,
        createdFiles: ['src/utils/logger.js']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createTestSuite() {
    try {
      const testDir = path.join(this.projectRoot, 'test');
      await fs.mkdir(testDir, { recursive: true });

      // Create Jest configuration
      const jestConfig = `module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  testMatch: [
    '**/test/**/*.test.js',
    '**/src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};
`;

      await fs.writeFile(path.join(this.projectRoot, 'jest.config.js'), jestConfig);

      // Create sample test files
      const n8nClientTest = `import { N8nClient } from '../src/api/n8nClient.js';

describe('N8nClient', () => {
  let client;

  beforeEach(() => {
    client = new N8nClient();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      expect(client).toBeDefined();
      expect(client.baseUrl).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should return success for valid connection', async () => {
      // Mock successful response
      const mockResponse = { data: [] };
      client.client.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.testConnection();
      expect(result.success).toBe(true);
    });

    it('should return failure for invalid connection', async () => {
      // Mock failed response
      client.client.get = jest.fn().mockRejectedValue(new Error('Connection failed'));

      const result = await client.testConnection();
      expect(result.success).toBe(false);
    });
  });
});
`;

      const flowManagerTest = `import { FlowManager } from '../src/core/flowManager.js';

describe('FlowManager', () => {
  let flowManager;

  beforeEach(() => {
    flowManager = new FlowManager();
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file names correctly', () => {
      const result = flowManager.sanitizeFileName('My Workflow!@#.json');
      expect(result).toBe('my_workflow____.json');
    });

    it('should handle empty input', () => {
      const result = flowManager.sanitizeFileName('');
      expect(result).toBe('');
    });
  });

  describe('generateVersion', () => {
    it('should generate version string', () => {
      const version = flowManager.generateVersion();
      expect(version).toMatch(/^v\\d+$/);
    });
  });
});
`;

      await fs.writeFile(path.join(testDir, 'n8nClient.test.js'), n8nClientTest);
      await fs.writeFile(path.join(testDir, 'flowManager.test.js'), flowManagerTest);

      // Update package.json to include Jest
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      let packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      packageJson.devDependencies = packageJson.devDependencies || {};
      packageJson.devDependencies.jest = '^29.0.0';
      packageJson.scripts = packageJson.scripts || {};
      packageJson.scripts.test = 'jest';
      packageJson.scripts['test:coverage'] = 'jest --coverage';
      packageJson.scripts['test:watch'] = 'jest --watch';

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));

      return {
        success: true,
        message: 'Created comprehensive test suite',
        createdFiles: [
          'jest.config.js',
          'test/n8nClient.test.js',
          'test/flowManager.test.js'
        ],
        modifiedFiles: ['package.json']
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async fixSyncOperations(files) {
    try {
      let modifiedFiles = 0;
      
      for (const file of files || []) {
        const filePath = path.join(this.projectRoot, file);
        
        try {
          let content = await fs.readFile(filePath, 'utf8');
          let modified = false;
          
          // Replace common synchronous operations
          const replacements = [
            { from: 'fs.readFileSync', to: 'await fs.readFile' },
            { from: 'fs.writeFileSync', to: 'await fs.writeFile' },
            { from: 'fs.existsSync', to: 'await fs.access' },
            { from: 'fs.mkdirSync', to: 'await fs.mkdir' }
          ];
          
          replacements.forEach(replacement => {
            if (content.includes(replacement.from)) {
              content = content.replace(new RegExp(replacement.from, 'g'), replacement.to);
              modified = true;
            }
          });
          
          // Add fs import if not present and we made changes
          if (modified && !content.includes("import fs from 'fs/promises'")) {
            content = "import fs from 'fs/promises';\n" + content;
          }
          
          if (modified) {
            await fs.writeFile(filePath, content);
            modifiedFiles++;
          }
        } catch (fileError) {
          console.log(`Could not process file ${file}: ${fileError.message}`);
        }
      }
      
      return {
        success: true,
        message: `Fixed synchronous operations in ${modifiedFiles} files`,
        modifiedFiles
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async optimizeParallelOperations(files) {
    try {
      let modifiedFiles = 0;
      
      for (const file of files || []) {
        const filePath = path.join(this.projectRoot, file);
        
        try {
          let content = await fs.readFile(filePath, 'utf8');
          let modified = false;
          
          // Look for sequential await patterns that could be parallel
          const sequentialAwaitPattern = /(await\s+[^;]+;[\s\n]*await\s+[^;]+;)/g;
          
          content = content.replace(sequentialAwaitPattern, (match) => {
            // Simple pattern: convert two sequential awaits to Promise.all
            const awaits = match.match(/await\s+([^;]+)/g);
            if (awaits && awaits.length === 2) {
              const operations = awaits.map(a => a.replace('await ', ''));
              modified = true;
              return `const [result1, result2] = await Promise.all([${operations.join(', ')}]);`;
            }
            return match;
          });
          
          if (modified) {
            await fs.writeFile(filePath, content);
            modifiedFiles++;
          }
        } catch (fileError) {
          console.log(`Could not process file ${file}: ${fileError.message}`);
        }
      }
      
      return {
        success: true,
        message: `Optimized parallel operations in ${modifiedFiles} files`,
        modifiedFiles
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateDryRunReport(executionPlan, analysis) {
    return {
      success: true,
      dryRun: true,
      analysis: {
        summary: analysis.summary,
        issues: {
          critical: analysis.summary.severityBreakdown.critical,
          high: analysis.summary.severityBreakdown.high,
          medium: analysis.summary.severityBreakdown.medium,
          low: analysis.summary.severityBreakdown.low
        }
      },
      executionPlan: {
        totalPhases: executionPlan.phases.length,
        totalTasks: executionPlan.totalTasks,
        automatedTasks: this.countAutomatedTasks(executionPlan),
        manualTasks: this.countManualTasks(executionPlan),
        estimatedTime: executionPlan.estimatedTime
      },
      recommendations: executionPlan.phases.map(phase => ({
        priority: phase.priority,
        title: phase.title,
        taskCount: phase.tasks.length,
        automatedCount: phase.tasks.filter(t => t.automated).length,
        tasks: phase.tasks.map(task => ({
          description: task.description,
          type: task.type,
          automated: task.automated,
          files: task.files
        }))
      })),
      message: 'Dry run complete. Use --apply to execute automated improvements.'
    };
  }

  countAutomatedTasks(executionPlan) {
    return executionPlan.phases.reduce((count, phase) => {
      return count + phase.tasks.filter(task => task.automated).length;
    }, 0);
  }

  countManualTasks(executionPlan) {
    return executionPlan.phases.reduce((count, phase) => {
      return count + phase.tasks.filter(task => !task.automated).length;
    }, 0);
  }
}