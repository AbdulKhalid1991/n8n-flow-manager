import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EnhancementAgent {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.analysisResults = {
      codeQuality: {},
      security: {},
      performance: {},
      usability: {},
      architecture: {},
      maintenance: {}
    };
    this.recommendations = [];
  }

  async analyzeProject() {
    console.log('🔍 Enhancement Agent: Starting comprehensive project analysis...');
    
    try {
      await this.scanProjectStructure();
      await this.analyzeCodeQuality();
      await this.analyzeSecurityIssues();
      await this.analyzePerformanceIssues();
      await this.analyzeUsabilityIssues();
      await this.analyzeArchitectureIssues();
      await this.analyzeMaintenanceIssues();
      
      this.generateRecommendations();
      
      return {
        success: true,
        analysis: this.analysisResults,
        recommendations: this.recommendations,
        summary: this.generateSummary()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }

  async scanProjectStructure() {
    const structure = await this.getDirectoryStructure(this.projectRoot);
    this.analysisResults.architecture.structure = structure;
    
    // Analyze project organization
    const issues = [];
    
    if (!structure.includes('tests/') && !structure.includes('test/') && !structure.includes('__tests__/')) {
      issues.push({
        type: 'missing_tests',
        severity: 'high',
        message: 'No test directory found',
        impact: 'No automated testing capability'
      });
    }
    
    if (!structure.includes('docs/') && !structure.includes('documentation/')) {
      issues.push({
        type: 'missing_docs',
        severity: 'medium', 
        message: 'No documentation directory found',
        impact: 'Poor documentation organization'
      });
    }
    
    if (!structure.includes('.env.example')) {
      issues.push({
        type: 'missing_env_example',
        severity: 'high',
        message: 'No .env.example file found',
        impact: 'Difficult setup process for new developers'
      });
    }

    this.analysisResults.architecture.issues = issues;
  }

  async analyzeCodeQuality() {
    const jsFiles = await this.findJavaScriptFiles();
    const qualityIssues = [];
    
    for (const filePath of jsFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const fileIssues = await this.analyzeFileQuality(filePath, content);
      qualityIssues.push(...fileIssues);
    }
    
    this.analysisResults.codeQuality = {
      totalFiles: jsFiles.length,
      issues: qualityIssues,
      metrics: this.calculateQualityMetrics(qualityIssues)
    };
  }

  async analyzeFileQuality(filePath, content) {
    const issues = [];
    const relativePath = path.relative(this.projectRoot, filePath);
    
    // Check for error handling
    const tryBlocks = (content.match(/try\s*{/g) || []).length;
    const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
    
    if (tryBlocks > catchBlocks) {
      issues.push({
        file: relativePath,
        type: 'missing_error_handling',
        severity: 'high',
        message: 'Try blocks without corresponding catch blocks',
        line: this.findLineNumber(content, 'try')
      });
    }
    
    // Check for TODO/FIXME comments
    const todos = content.match(/\/\/.*TODO|\/\/.*FIXME|\/\*.*TODO.*\*\/|\/\*.*FIXME.*\*\//gi) || [];
    if (todos.length > 0) {
      issues.push({
        file: relativePath,
        type: 'todo_comments',
        severity: 'low',
        message: `${todos.length} TODO/FIXME comments found`,
        details: todos
      });
    }
    
    // Check for console.log statements (should use proper logging)
    const consoleLogs = content.match(/console\.(log|error|warn|info)/g) || [];
    if (consoleLogs.length > 3) {
      issues.push({
        file: relativePath,
        type: 'console_logging',
        severity: 'medium',
        message: `${consoleLogs.length} console statements found`,
        recommendation: 'Use proper logging framework'
      });
    }
    
    // Check for hardcoded strings that should be configurable
    const hardcodedUrls = content.match(/https?:\/\/[^\s'"]+/g) || [];
    const hardcodedPaths = content.match(/\/[a-zA-Z0-9\/._-]+/g) || [];
    
    if (hardcodedUrls.length > 0 || hardcodedPaths.length > 0) {
      issues.push({
        file: relativePath,
        type: 'hardcoded_values',
        severity: 'medium',
        message: 'Hardcoded URLs or paths detected',
        urls: hardcodedUrls.length,
        paths: hardcodedPaths.length
      });
    }
    
    // Check for large functions (> 50 lines)
    const functions = this.extractFunctions(content);
    const largeFunctions = functions.filter(fn => fn.lines > 50);
    
    if (largeFunctions.length > 0) {
      issues.push({
        file: relativePath,
        type: 'large_functions',
        severity: 'medium',
        message: `${largeFunctions.length} functions over 50 lines`,
        functions: largeFunctions.map(fn => ({ name: fn.name, lines: fn.lines }))
      });
    }
    
    // Check for missing JSDoc
    const publicMethods = this.extractPublicMethods(content);
    const undocumentedMethods = publicMethods.filter(method => !method.hasDoc);
    
    if (undocumentedMethods.length > 0) {
      issues.push({
        file: relativePath,
        type: 'missing_documentation',
        severity: 'low',
        message: `${undocumentedMethods.length} public methods without JSDoc`,
        methods: undocumentedMethods.map(m => m.name)
      });
    }
    
    return issues;
  }

  async analyzeSecurityIssues() {
    const jsFiles = await this.findJavaScriptFiles();
    const securityIssues = [];
    
    for (const filePath of jsFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const fileIssues = await this.analyzeFileSecurity(filePath, content);
      securityIssues.push(...fileIssues);
    }
    
    this.analysisResults.security = {
      issues: securityIssues,
      riskLevel: this.calculateSecurityRisk(securityIssues)
    };
  }

  async analyzeFileSecurity(filePath, content) {
    const issues = [];
    const relativePath = path.relative(this.projectRoot, filePath);
    
    // Check for potential command injection
    if (content.includes('exec(') || content.includes('spawn(')) {
      const hasUnsafeExec = /exec\s*\(\s*[`"'].*\$\{.*\}.*[`"']/.test(content);
      if (hasUnsafeExec) {
        issues.push({
          file: relativePath,
          type: 'command_injection',
          severity: 'critical',
          message: 'Potential command injection vulnerability',
          recommendation: 'Use parameterized commands'
        });
      }
    }
    
    // Check for hardcoded secrets
    const secretPatterns = [
      /password\s*[=:]\s*['"][^'"]+['"]/gi,
      /secret\s*[=:]\s*['"][^'"]+['"]/gi,
      /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/gi,
      /token\s*[=:]\s*['"][^'"]+['"]/gi
    ];
    
    secretPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        issues.push({
          file: relativePath,
          type: 'hardcoded_secrets',
          severity: 'high',
          message: `${matches.length} potential hardcoded secrets found`,
          recommendation: 'Use environment variables or secure vaults'
        });
      }
    });
    
    // Check for unsafe JSON parsing
    if (content.includes('JSON.parse') && !content.includes('try')) {
      issues.push({
        file: relativePath,
        type: 'unsafe_json_parsing',
        severity: 'medium',
        message: 'JSON.parse without error handling',
        recommendation: 'Wrap JSON.parse in try-catch blocks'
      });
    }
    
    // Check for path traversal vulnerabilities
    if (content.includes('path.join') && content.includes('req.') || content.includes('input')) {
      issues.push({
        file: relativePath,
        type: 'path_traversal_risk',
        severity: 'medium',
        message: 'Potential path traversal vulnerability',
        recommendation: 'Validate and sanitize file paths'
      });
    }
    
    return issues;
  }

  async analyzePerformanceIssues() {
    const jsFiles = await this.findJavaScriptFiles();
    const performanceIssues = [];
    
    for (const filePath of jsFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const fileIssues = this.analyzeFilePerformance(filePath, content);
      performanceIssues.push(...fileIssues);
    }
    
    this.analysisResults.performance = {
      issues: performanceIssues,
      optimizationPotential: this.calculateOptimizationPotential(performanceIssues)
    };
  }

  analyzeFilePerformance(filePath, content) {
    const issues = [];
    const relativePath = path.relative(this.projectRoot, filePath);
    
    // Check for synchronous operations in async contexts
    const syncOperations = [
      'fs.readFileSync',
      'fs.writeFileSync', 
      'fs.existsSync',
      'JSON.parse', // when used with large data
    ];
    
    syncOperations.forEach(operation => {
      if (content.includes(operation) && content.includes('async ')) {
        issues.push({
          file: relativePath,
          type: 'sync_in_async',
          severity: 'medium',
          message: `Synchronous ${operation} in async function`,
          recommendation: `Use async version: ${operation.replace('Sync', '')}`
        });
      }
    });
    
    // Check for sequential API calls that could be parallel
    const awaitPattern = /await\s+[^;]+;[\s\n]*await\s+[^;]+;/g;
    const sequentialAwaits = content.match(awaitPattern) || [];
    
    if (sequentialAwaits.length > 0) {
      issues.push({
        file: relativePath,
        type: 'sequential_operations',
        severity: 'medium',
        message: `${sequentialAwaits.length} sequential awaits that could be parallel`,
        recommendation: 'Use Promise.all for independent operations'
      });
    }
    
    // Check for inefficient loops
    const forLoops = content.match(/for\s*\([^)]+\)/g) || [];
    const nestedLoops = this.countNestedLoops(content);
    
    if (nestedLoops > 2) {
      issues.push({
        file: relativePath,
        type: 'nested_loops',
        severity: 'high',
        message: `${nestedLoops} levels of nested loops detected`,
        recommendation: 'Consider algorithmic optimization'
      });
    }
    
    // Check for memory leaks potential
    if (content.includes('setInterval') && !content.includes('clearInterval')) {
      issues.push({
        file: relativePath,
        type: 'memory_leak_risk',
        severity: 'high',
        message: 'setInterval without clearInterval',
        recommendation: 'Always clear intervals to prevent memory leaks'
      });
    }
    
    return issues;
  }

  async analyzeUsabilityIssues() {
    // Analyze CLI usability
    const cliFile = path.join(this.projectRoot, 'src/cli/commands.js');
    let cliContent = '';
    
    try {
      cliContent = await fs.readFile(cliFile, 'utf8');
    } catch (error) {
      // CLI file not found
    }
    
    const usabilityIssues = [];
    
    // Check for help text quality
    if (cliContent) {
      const commands = cliContent.match(/\.command\(['"](.*?)['"]\)/g) || [];
      const descriptions = cliContent.match(/\.description\(['"](.*?)['"]\)/g) || [];
      
      if (commands.length > descriptions.length) {
        usabilityIssues.push({
          type: 'missing_descriptions',
          severity: 'medium',
          message: 'Some CLI commands lack descriptions',
          impact: 'Poor user experience'
        });
      }
      
      // Check for progress indicators
      const hasProgress = cliContent.includes('progress') || cliContent.includes('spinner');
      if (!hasProgress) {
        usabilityIssues.push({
          type: 'no_progress_indicators',
          severity: 'medium',
          message: 'No progress indicators for long operations',
          recommendation: 'Add progress bars or spinners'
        });
      }
    }
    
    // Check README quality
    const readmePath = path.join(this.projectRoot, 'README.md');
    try {
      const readmeContent = await fs.readFile(readmePath, 'utf8');
      const readmeIssues = this.analyzeReadmeQuality(readmeContent);
      usabilityIssues.push(...readmeIssues);
    } catch (error) {
      usabilityIssues.push({
        type: 'missing_readme',
        severity: 'high',
        message: 'No README.md file found',
        impact: 'Poor project documentation'
      });
    }
    
    this.analysisResults.usability = { issues: usabilityIssues };
  }

  analyzeReadmeQuality(content) {
    const issues = [];
    
    const requiredSections = [
      'installation',
      'usage', 
      'configuration',
      'examples',
      'contributing',
      'license'
    ];
    
    const missingSections = requiredSections.filter(section => 
      !content.toLowerCase().includes(section)
    );
    
    if (missingSections.length > 0) {
      issues.push({
        type: 'incomplete_readme',
        severity: 'medium',
        message: `Missing sections: ${missingSections.join(', ')}`,
        recommendation: 'Add comprehensive documentation sections'
      });
    }
    
    // Check for code examples
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    if (codeBlocks.length < 3) {
      issues.push({
        type: 'few_examples',
        severity: 'low',
        message: 'Limited code examples in README',
        recommendation: 'Add more practical examples'
      });
    }
    
    return issues;
  }

  async analyzeArchitectureIssues() {
    const architectureIssues = [];
    
    // Analyze dependency structure
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    try {
      const packageContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageContent);
      
      const depIssues = this.analyzeDependencies(packageJson);
      architectureIssues.push(...depIssues);
      
    } catch (error) {
      architectureIssues.push({
        type: 'missing_package_json',
        severity: 'critical',
        message: 'No package.json found'
      });
    }
    
    // Analyze module coupling
    const jsFiles = await this.findJavaScriptFiles();
    const couplingIssues = await this.analyzeCoupling(jsFiles);
    architectureIssues.push(...couplingIssues);
    
    this.analysisResults.architecture.issues = architectureIssues;
  }

  analyzeDependencies(packageJson) {
    const issues = [];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for outdated major versions (basic check)
    const potentiallyOutdated = [];
    Object.entries(deps).forEach(([name, version]) => {
      if (version.startsWith('^') || version.startsWith('~')) {
        const majorVersion = parseInt(version.replace(/[\^~]/, ''));
        if (majorVersion < 1) {
          potentiallyOutdated.push(name);
        }
      }
    });
    
    if (potentiallyOutdated.length > 0) {
      issues.push({
        type: 'potentially_outdated_deps',
        severity: 'medium',
        message: `${potentiallyOutdated.length} dependencies may need updates`,
        packages: potentiallyOutdated
      });
    }
    
    // Check for security-sensitive packages
    const securityPackages = ['crypto', 'bcrypt', 'jsonwebtoken', 'helmet'];
    const foundSecurityPackages = securityPackages.filter(pkg => deps[pkg]);
    
    if (foundSecurityPackages.length > 0) {
      issues.push({
        type: 'security_sensitive_deps',
        severity: 'info',
        message: 'Security-sensitive dependencies detected',
        packages: foundSecurityPackages,
        recommendation: 'Regularly audit these packages for vulnerabilities'
      });
    }
    
    return issues;
  }

  async analyzeMaintenanceIssues() {
    const maintenanceIssues = [];
    
    // Check for configuration management
    const configFiles = ['.env.example', 'config.json', 'settings.json'];
    const missingConfigs = [];
    
    for (const configFile of configFiles) {
      try {
        await fs.access(path.join(this.projectRoot, configFile));
      } catch {
        missingConfigs.push(configFile);
      }
    }
    
    if (missingConfigs.includes('.env.example')) {
      maintenanceIssues.push({
        type: 'missing_env_example',
        severity: 'high',
        message: 'No .env.example file for configuration template'
      });
    }
    
    // Check for logging configuration
    const jsFiles = await this.findJavaScriptFiles();
    let hasLoggingFramework = false;
    
    for (const filePath of jsFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      if (content.includes('winston') || content.includes('bunyan') || content.includes('pino')) {
        hasLoggingFramework = true;
        break;
      }
    }
    
    if (!hasLoggingFramework) {
      maintenanceIssues.push({
        type: 'no_logging_framework',
        severity: 'medium',
        message: 'No proper logging framework detected',
        recommendation: 'Implement structured logging with Winston or similar'
      });
    }
    
    this.analysisResults.maintenance = { issues: maintenanceIssues };
  }

  generateRecommendations() {
    const allIssues = [
      ...this.analysisResults.codeQuality.issues || [],
      ...this.analysisResults.security.issues || [],
      ...this.analysisResults.performance.issues || [],
      ...this.analysisResults.usability.issues || [],
      ...this.analysisResults.architecture.issues || [],
      ...this.analysisResults.maintenance.issues || []
    ];
    
    // Prioritize recommendations
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
    const highIssues = allIssues.filter(issue => issue.severity === 'high');
    const mediumIssues = allIssues.filter(issue => issue.severity === 'medium');
    const lowIssues = allIssues.filter(issue => issue.severity === 'low');
    
    this.recommendations = [
      {
        priority: 'IMMEDIATE',
        title: 'Critical Security & Functionality Issues',
        items: this.createRecommendationItems(criticalIssues),
        estimatedEffort: 'High',
        impact: 'Critical'
      },
      {
        priority: 'HIGH',
        title: 'High Priority Improvements',
        items: this.createRecommendationItems(highIssues),
        estimatedEffort: 'Medium-High',
        impact: 'High'
      },
      {
        priority: 'MEDIUM',
        title: 'Quality & Performance Enhancements',
        items: this.createRecommendationItems(mediumIssues),
        estimatedEffort: 'Medium',
        impact: 'Medium'
      },
      {
        priority: 'LOW',
        title: 'Polish & Documentation',
        items: this.createRecommendationItems(lowIssues),
        estimatedEffort: 'Low',
        impact: 'Low'
      }
    ];
  }

  createRecommendationItems(issues) {
    const items = [];
    const groupedIssues = this.groupIssuesByType(issues);
    
    Object.entries(groupedIssues).forEach(([type, typeIssues]) => {
      const item = {
        type,
        count: typeIssues.length,
        description: this.getIssueTypeDescription(type),
        actionPlan: this.getActionPlan(type),
        files: [...new Set(typeIssues.map(issue => issue.file).filter(Boolean))]
      };
      items.push(item);
    });
    
    return items;
  }

  groupIssuesByType(issues) {
    return issues.reduce((groups, issue) => {
      const type = issue.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(issue);
      return groups;
    }, {});
  }

  getIssueTypeDescription(type) {
    const descriptions = {
      'missing_error_handling': 'Add comprehensive error handling and recovery mechanisms',
      'command_injection': 'Fix potential command injection vulnerabilities',
      'hardcoded_secrets': 'Move sensitive data to environment variables',
      'missing_tests': 'Implement comprehensive test suite',
      'console_logging': 'Replace console statements with proper logging framework',
      'sync_in_async': 'Replace synchronous operations with async alternatives',
      'sequential_operations': 'Optimize API calls using parallel execution',
      'missing_env_example': 'Create configuration template and validation',
      'no_progress_indicators': 'Add user experience improvements',
      'missing_documentation': 'Improve code documentation and examples'
    };
    
    return descriptions[type] || `Address ${type.replace(/_/g, ' ')} issues`;
  }

  getActionPlan(type) {
    const actionPlans = {
      'missing_error_handling': [
        'Create custom Error classes for different error types',
        'Add try-catch blocks around all async operations',
        'Implement retry logic with exponential backoff',
        'Add proper error logging and user feedback'
      ],
      'command_injection': [
        'Replace string concatenation with parameterized commands',
        'Validate and sanitize all user inputs',
        'Use shell escape utilities',
        'Implement input whitelist validation'
      ],
      'hardcoded_secrets': [
        'Move all secrets to environment variables',
        'Add environment variable validation',
        'Implement secure credential storage',
        'Add secrets rotation capability'
      ],
      'missing_tests': [
        'Set up Jest testing framework',
        'Create unit tests for all modules',
        'Add integration tests for API interactions',
        'Implement test coverage reporting'
      ]
    };
    
    return actionPlans[type] || [`Fix ${type.replace(/_/g, ' ')} issues`];
  }

  generateSummary() {
    const totalIssues = Object.values(this.analysisResults).reduce((sum, category) => {
      return sum + (category.issues ? category.issues.length : 0);
    }, 0);
    
    const criticalCount = this.countIssuesBySeverity('critical');
    const highCount = this.countIssuesBySeverity('high');
    const mediumCount = this.countIssuesBySeverity('medium');
    const lowCount = this.countIssuesBySeverity('low');
    
    return {
      totalIssues,
      severityBreakdown: {
        critical: criticalCount,
        high: highCount,  
        medium: mediumCount,
        low: lowCount
      },
      overallRating: this.calculateOverallRating(criticalCount, highCount, mediumCount),
      recommendations: this.recommendations.length,
      estimatedEffort: this.calculateEstimatedEffort()
    };
  }

  countIssuesBySeverity(severity) {
    let count = 0;
    Object.values(this.analysisResults).forEach(category => {
      if (category.issues) {
        count += category.issues.filter(issue => issue.severity === severity).length;
      }
    });
    return count;
  }

  calculateOverallRating(critical, high, medium) {
    if (critical > 0) return 'Poor';
    if (high > 3) return 'Below Average';
    if (high > 0 || medium > 5) return 'Average';
    if (medium > 0) return 'Good';
    return 'Excellent';
  }

  calculateEstimatedEffort() {
    const critical = this.countIssuesBySeverity('critical');
    const high = this.countIssuesBySeverity('high');
    const medium = this.countIssuesBySeverity('medium');
    
    // Rough estimation in hours
    const totalHours = (critical * 8) + (high * 4) + (medium * 2);
    
    if (totalHours > 80) return '3-4 weeks';
    if (totalHours > 40) return '1-2 weeks';
    if (totalHours > 20) return '3-5 days';
    if (totalHours > 8) return '1-2 days';
    return '< 1 day';
  }

  // Helper methods
  async getDirectoryStructure(dir, relativeTo = dir) {
    const items = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.relative(relativeTo, fullPath);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          items.push(relativePath + '/');
          const subItems = await this.getDirectoryStructure(fullPath, relativeTo);
          items.push(...subItems);
        } else if (entry.isFile()) {
          items.push(relativePath);
        }
      }
    } catch (error) {
      // Directory access error
    }
    return items;
  }

  async findJavaScriptFiles() {
    const jsFiles = [];
    const structure = await this.getDirectoryStructure(this.projectRoot);
    
    structure.forEach(item => {
      if (item.endsWith('.js') || item.endsWith('.mjs')) {
        jsFiles.push(path.join(this.projectRoot, item));
      }
    });
    
    return jsFiles;
  }

  findLineNumber(content, searchTerm) {
    const lines = content.split('\n');
    const lineIndex = lines.findIndex(line => line.includes(searchTerm));
    return lineIndex >= 0 ? lineIndex + 1 : null;
  }

  extractFunctions(content) {
    const functionRegex = /(?:function\s+(\w+)|(\w+)\s*[:=]\s*function|async\s+function\s+(\w+))\s*\([^)]*\)\s*{/g;
    const functions = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1] || match[2] || match[3] || 'anonymous';
      const startIndex = match.index;
      const lines = this.countLinesInFunction(content, startIndex);
      
      functions.push({
        name: functionName,
        lines,
        startIndex
      });
    }
    
    return functions;
  }

  countLinesInFunction(content, startIndex) {
    let braceCount = 0;
    let inFunction = false;
    let lineCount = 1;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '\n') lineCount++;
      if (content[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) break;
      }
    }
    
    return lineCount;
  }

  extractPublicMethods(content) {
    const methods = [];
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*{/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      const methodStart = match.index;
      
      // Check if method has JSDoc (look backwards for /** comment)
      const beforeMethod = content.substring(Math.max(0, methodStart - 200), methodStart);
      const hasDoc = /\/\*\*[\s\S]*?\*\/\s*$/.test(beforeMethod);
      
      methods.push({
        name: methodName,
        hasDoc
      });
    }
    
    return methods;
  }

  countNestedLoops(content) {
    let maxNesting = 0;
    let currentNesting = 0;
    
    const lines = content.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('for') || trimmedLine.startsWith('while')) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      
      if (closeBraces > openBraces) {
        currentNesting = Math.max(0, currentNesting - (closeBraces - openBraces));
      }
    });
    
    return maxNesting;
  }

  calculateQualityMetrics(issues) {
    const severityCounts = issues.reduce((counts, issue) => {
      counts[issue.severity] = (counts[issue.severity] || 0) + 1;
      return counts;
    }, {});
    
    return {
      totalIssues: issues.length,
      ...severityCounts,
      qualityScore: Math.max(0, 100 - (issues.length * 2))
    };
  }

  calculateSecurityRisk(issues) {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) return 'CRITICAL';
    if (highIssues > 2) return 'HIGH';
    if (highIssues > 0) return 'MEDIUM';
    return 'LOW';
  }

  calculateOptimizationPotential(issues) {
    const performanceIssueTypes = ['sequential_operations', 'sync_in_async', 'nested_loops', 'memory_leak_risk'];
    const relevantIssues = issues.filter(issue => performanceIssueTypes.includes(issue.type));
    
    if (relevantIssues.length > 10) return 'HIGH';
    if (relevantIssues.length > 5) return 'MEDIUM';
    if (relevantIssues.length > 0) return 'LOW';
    return 'MINIMAL';
  }

  async analyzeCoupling(jsFiles) {
    const couplingIssues = [];
    const imports = new Map();
    
    for (const filePath of jsFiles) {
      const content = await fs.readFile(filePath, 'utf8');
      const fileImports = this.extractImports(content);
      imports.set(filePath, fileImports);
    }
    
    // Simple coupling analysis
    const highCouplingFiles = [];
    imports.forEach((fileImports, filePath) => {
      if (fileImports.length > 8) {
        highCouplingFiles.push({
          file: path.relative(this.projectRoot, filePath),
          imports: fileImports.length
        });
      }
    });
    
    if (highCouplingFiles.length > 0) {
      couplingIssues.push({
        type: 'high_coupling',
        severity: 'medium',
        message: `${highCouplingFiles.length} files with high coupling`,
        files: highCouplingFiles,
        recommendation: 'Consider breaking down large modules'
      });
    }
    
    return couplingIssues;
  }

  extractImports(content) {
    const importRegex = /import\s+.*?\s+from\s+['"][^'"]+['"]/g;
    const requireRegex = /require\s*\(\s*['"][^'"]+['"]\s*\)/g;
    
    const imports = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }
    
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[0]);
    }
    
    return imports;
  }
}