import fs from 'fs';
import path from 'path';
import { config } from './config.js';

export class EnvironmentValidator {
  constructor() {
    this.validationErrors = [];
    this.validationWarnings = [];
    this.requiredVariables = [
      'N8N_BASE_URL',
      'N8N_API_KEY'
    ];
    this.recommendedVariables = [
      'GIT_AUTHOR_NAME',
      'GIT_AUTHOR_EMAIL',
      'LOG_LEVEL'
    ];
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment configuration...');
    
    this.validationErrors = [];
    this.validationWarnings = [];

    // Check if .env file exists
    this.checkEnvFile();
    
    // Validate required environment variables
    this.validateRequiredVariables();
    
    // Validate recommended variables
    this.validateRecommendedVariables();
    
    // Validate n8n connection details
    await this.validateN8nConnection();
    
    // Validate directory permissions
    this.validateDirectories();
    
    return this.getValidationReport();
  }

  checkEnvFile() {
    const envPath = path.resolve(process.cwd(), '.env');
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    
    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envExamplePath)) {
        this.validationErrors.push({
          type: 'missing_env_file',
          message: '.env file not found',
          solution: 'Copy .env.example to .env and configure your settings',
          command: 'cp .env.example .env'
        });
      } else {
        this.validationErrors.push({
          type: 'missing_env_files',
          message: 'Neither .env nor .env.example found',
          solution: 'Create .env file with required configuration'
        });
      }
    }
  }

  validateRequiredVariables() {
    for (const variable of this.requiredVariables) {
      const value = process.env[variable];
      
      if (!value) {
        this.validationErrors.push({
          type: 'missing_required_variable',
          variable: variable,
          message: `Required environment variable ${variable} is not set`,
          solution: `Add ${variable}=your_value to your .env file`
        });
      } else if (value.trim() === '') {
        this.validationErrors.push({
          type: 'empty_required_variable',
          variable: variable,
          message: `Required environment variable ${variable} is empty`,
          solution: `Set a valid value for ${variable} in your .env file`
        });
      } else {
        // Variable-specific validation
        this.validateSpecificVariable(variable, value);
      }
    }
  }

  validateSpecificVariable(variable, value) {
    switch (variable) {
      case 'N8N_BASE_URL':
        if (!this.isValidUrl(value)) {
          this.validationErrors.push({
            type: 'invalid_url',
            variable: variable,
            message: `${variable} is not a valid URL: ${value}`,
            solution: 'Use format: http://localhost:5678 or https://your-n8n-instance.com'
          });
        }
        break;
        
      case 'N8N_API_KEY':
        if (value.length < 10) {
          this.validationWarnings.push({
            type: 'suspicious_api_key',
            variable: variable,
            message: `${variable} seems too short, may be invalid`,
            solution: 'Verify your n8n API key is correct'
          });
        }
        break;
    }
  }

  validateRecommendedVariables() {
    for (const variable of this.recommendedVariables) {
      const value = process.env[variable];
      
      if (!value) {
        this.validationWarnings.push({
          type: 'missing_recommended_variable',
          variable: variable,
          message: `Recommended environment variable ${variable} is not set`,
          solution: `Consider adding ${variable} to your .env file for better functionality`
        });
      }
    }
  }

  async validateN8nConnection() {
    if (!config.n8n.baseUrl || !config.n8n.apiKey) {
      return; // Skip connection test if basic config is missing
    }

    try {
      console.log('🔗 Testing n8n connection...');
      
      const axios = await import('axios');
      const response = await axios.default.get(`${config.n8n.baseUrl}/rest/workflows`, {
        headers: {
          'X-N8N-API-KEY': config.n8n.apiKey
        },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ n8n connection successful');
      }
    } catch (error) {
      let errorMessage = 'Failed to connect to n8n instance';
      let solution = 'Check your N8N_BASE_URL and N8N_API_KEY settings';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to n8n server';
        solution = 'Ensure n8n is running and accessible at the configured URL';
      } else if (error.response?.status === 401) {
        errorMessage = 'n8n API key authentication failed';
        solution = 'Verify your N8N_API_KEY is correct and has proper permissions';
      } else if (error.response?.status === 404) {
        errorMessage = 'n8n API endpoint not found';
        solution = 'Check your N8N_BASE_URL is correct and n8n API is enabled';
      }
      
      this.validationErrors.push({
        type: 'n8n_connection_failed',
        message: errorMessage,
        solution: solution,
        details: error.message
      });
    }
  }

  validateDirectories() {
    const directories = [
      { path: config.git.flowsDirectory, name: 'flows directory' },
      { path: config.git.backupDirectory, name: 'backup directory' }
    ];
    
    for (const dir of directories) {
      try {
        if (!fs.existsSync(dir.path)) {
          // Try to create the directory
          fs.mkdirSync(dir.path, { recursive: true });
          console.log(`📁 Created ${dir.name}: ${dir.path}`);
        }
        
        // Test write permissions
        const testFile = path.join(dir.path, '.write-test');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        
      } catch (error) {
        this.validationErrors.push({
          type: 'directory_permission_error',
          message: `Cannot create or write to ${dir.name}: ${dir.path}`,
          solution: `Check directory permissions or create the directory manually`,
          details: error.message
        });
      }
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  getValidationReport() {
    const hasErrors = this.validationErrors.length > 0;
    const hasWarnings = this.validationWarnings.length > 0;
    
    const report = {
      success: !hasErrors,
      ready: !hasErrors && this.validationWarnings.length === 0,
      errors: this.validationErrors,
      warnings: this.validationWarnings,
      summary: {
        totalErrors: this.validationErrors.length,
        totalWarnings: this.validationWarnings.length,
        criticalIssues: this.validationErrors.filter(e => 
          ['missing_env_file', 'n8n_connection_failed', 'missing_required_variable'].includes(e.type)
        ).length
      }
    };
    
    // Generate setup instructions
    if (hasErrors || hasWarnings) {
      report.setupInstructions = this.generateSetupInstructions();
    }
    
    return report;
  }

  generateSetupInstructions() {
    const instructions = [];
    
    // Check for missing .env
    if (this.validationErrors.some(e => e.type === 'missing_env_file')) {
      instructions.push({
        step: 1,
        title: 'Create environment file',
        command: 'cp .env.example .env',
        description: 'Copy the example environment file'
      });
    }
    
    // Check for missing required variables
    const missingVars = this.validationErrors.filter(e => e.type === 'missing_required_variable');
    if (missingVars.length > 0) {
      instructions.push({
        step: 2,
        title: 'Configure required variables',
        description: 'Edit .env file and set these required variables:',
        variables: missingVars.map(v => v.variable)
      });
    }
    
    // Check for n8n connection issues
    if (this.validationErrors.some(e => e.type === 'n8n_connection_failed')) {
      instructions.push({
        step: 3,
        title: 'Verify n8n connection',
        description: 'Ensure n8n is running and API key is correct',
        commands: [
          'Check n8n is accessible in browser',
          'Verify API key in n8n settings',
          'Test connection: npm start test-connection'
        ]
      });
    }
    
    return instructions;
  }

  async autoFix() {
    console.log('🔧 Attempting to auto-fix common issues...');
    
    const fixes = [];
    
    // Auto-create .env from .env.example
    const envPath = path.resolve(process.cwd(), '.env');
    const envExamplePath = path.resolve(process.cwd(), '.env.example');
    
    if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
      try {
        fs.copyFileSync(envExamplePath, envPath);
        fixes.push('Created .env file from .env.example');
        console.log('✅ Created .env file from .env.example');
      } catch (error) {
        console.error('❌ Failed to create .env file:', error.message);
      }
    }
    
    // Auto-create directories
    const directories = [config.git.flowsDirectory, config.git.backupDirectory];
    for (const dir of directories) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          fixes.push(`Created directory: ${dir}`);
          console.log(`✅ Created directory: ${dir}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create directory ${dir}:`, error.message);
      }
    }
    
    return {
      success: fixes.length > 0,
      fixes: fixes,
      message: fixes.length > 0 ? 
        `Applied ${fixes.length} automatic fixes` : 
        'No automatic fixes available'
    };
  }

  printValidationReport(report) {
    console.log('\n📊 Environment Validation Report');
    console.log('═'.repeat(50));
    
    if (report.success) {
      console.log('✅ Environment configuration is valid');
      if (report.warnings.length > 0) {
        console.log(`⚠️  ${report.warnings.length} warning(s) found`);
      }
    } else {
      console.log(`❌ Found ${report.errors.length} error(s)`);
      if (report.warnings.length > 0) {
        console.log(`⚠️  Found ${report.warnings.length} warning(s)`);
      }
    }
    
    // Print errors
    if (report.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      report.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.message}`);
        console.log(`   Solution: ${error.solution}`);
        if (error.command) {
          console.log(`   Command: ${error.command}`);
        }
      });
    }
    
    // Print warnings
    if (report.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      report.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.message}`);
        console.log(`   Solution: ${warning.solution}`);
      });
    }
    
    // Print setup instructions
    if (report.setupInstructions) {
      console.log('\n🛠️  SETUP INSTRUCTIONS:');
      report.setupInstructions.forEach(instruction => {
        console.log(`\nStep ${instruction.step}: ${instruction.title}`);
        console.log(`   ${instruction.description}`);
        if (instruction.command) {
          console.log(`   Run: ${instruction.command}`);
        }
        if (instruction.commands) {
          instruction.commands.forEach(cmd => {
            console.log(`   • ${cmd}`);
          });
        }
        if (instruction.variables) {
          instruction.variables.forEach(variable => {
            console.log(`   • ${variable}=your_value_here`);
          });
        }
      });
    }
    
    console.log('\n' + '═'.repeat(50));
    
    if (report.success) {
      console.log('🎉 System ready to use!');
      console.log('Try: npm start health');
    } else {
      console.log('🔧 Please fix the errors above and run validation again');
      console.log('Command: npm start validate');
    }
  }
}

export const environmentValidator = new EnvironmentValidator();