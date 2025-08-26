// Custom error classes for better error handling

export class N8nFlowManagerError extends Error {
  constructor(message, code = 'GENERIC_ERROR', details = {}) {
    super(message);
    this.name = 'N8nFlowManagerError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

export class ConfigurationError extends N8nFlowManagerError {
  constructor(message, details = {}) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

export class N8nConnectionError extends N8nFlowManagerError {
  constructor(message, details = {}) {
    super(message, 'N8N_CONNECTION_ERROR', details);
    this.name = 'N8nConnectionError';
  }
}

export class WorkflowError extends N8nFlowManagerError {
  constructor(message, workflowId, details = {}) {
    super(message, 'WORKFLOW_ERROR', { workflowId, ...details });
    this.name = 'WorkflowError';
    this.workflowId = workflowId;
  }
}

export class GitError extends N8nFlowManagerError {
  constructor(message, details = {}) {
    super(message, 'GIT_ERROR', details);
    this.name = 'GitError';
  }
}

export class ValidationError extends N8nFlowManagerError {
  constructor(message, validationErrors = [], details = {}) {
    super(message, 'VALIDATION_ERROR', { validationErrors, ...details });
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

export class FileSystemError extends N8nFlowManagerError {
  constructor(message, filePath, details = {}) {
    super(message, 'FILESYSTEM_ERROR', { filePath, ...details });
    this.name = 'FileSystemError';
    this.filePath = filePath;
  }
}

// Error handling utilities
export class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
  }

  // Handle and classify errors
  handle(error, context = {}) {
    const errorInfo = {
      message: error.message,
      name: error.name,
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
      context
    };

    // Log based on error type
    if (error instanceof ConfigurationError) {
      this.logger.error('Configuration error occurred', {
        ...errorInfo,
        type: 'configuration',
        details: error.details
      });
    } else if (error instanceof N8nConnectionError) {
      this.logger.error('n8n connection error occurred', {
        ...errorInfo,
        type: 'connection',
        details: error.details
      });
    } else if (error instanceof WorkflowError) {
      this.logger.error('Workflow operation error occurred', {
        ...errorInfo,
        type: 'workflow',
        workflowId: error.workflowId,
        details: error.details
      });
    } else if (error instanceof GitError) {
      this.logger.error('Git operation error occurred', {
        ...errorInfo,
        type: 'git',
        details: error.details
      });
    } else if (error instanceof ValidationError) {
      this.logger.error('Validation error occurred', {
        ...errorInfo,
        type: 'validation',
        validationErrors: error.validationErrors,
        details: error.details
      });
    } else if (error instanceof FileSystemError) {
      this.logger.error('File system error occurred', {
        ...errorInfo,
        type: 'filesystem',
        filePath: error.filePath,
        details: error.details
      });
    } else {
      // Generic error
      this.logger.error('Unexpected error occurred', {
        ...errorInfo,
        type: 'generic',
        stack: error.stack
      });
    }

    return errorInfo;
  }

  // Create user-friendly error messages
  createUserMessage(error) {
    if (error instanceof ConfigurationError) {
      return `Configuration issue: ${error.message}. Please check your .env file settings.`;
    } else if (error instanceof N8nConnectionError) {
      return `Cannot connect to n8n: ${error.message}. Please verify n8n is running and your connection settings are correct.`;
    } else if (error instanceof WorkflowError) {
      return `Workflow error: ${error.message}. Check workflow ${error.workflowId} for issues.`;
    } else if (error instanceof GitError) {
      return `Version control error: ${error.message}. Please check git configuration and permissions.`;
    } else if (error instanceof ValidationError) {
      return `Validation failed: ${error.message}. Please review and fix the validation errors.`;
    } else if (error instanceof FileSystemError) {
      return `File system error: ${error.message}. Check file permissions and disk space.`;
    } else {
      return `An unexpected error occurred: ${error.message}. Please try again or contact support.`;
    }
  }

  // Suggest solutions for common errors
  suggestSolution(error) {
    const solutions = [];

    if (error instanceof ConfigurationError) {
      solutions.push('Run "npm start validate" to check configuration');
      solutions.push('Ensure .env file exists and contains required variables');
      solutions.push('Copy .env.example to .env if needed');
    } else if (error instanceof N8nConnectionError) {
      solutions.push('Verify n8n is running at the configured URL');
      solutions.push('Check N8N_BASE_URL and N8N_API_KEY in .env file');
      solutions.push('Test connection with "npm start test-connection"');
    } else if (error instanceof WorkflowError) {
      solutions.push('Check workflow exists and is accessible');
      solutions.push('Verify workflow permissions in n8n');
      solutions.push('Try exporting/importing the workflow again');
    } else if (error instanceof GitError) {
      solutions.push('Check git configuration and credentials');
      solutions.push('Ensure repository is properly initialized');
      solutions.push('Verify write permissions to repository');
    } else if (error instanceof ValidationError) {
      solutions.push('Review validation error details');
      solutions.push('Fix configuration issues identified');
      solutions.push('Run validation again after fixes');
    } else if (error instanceof FileSystemError) {
      solutions.push('Check file and directory permissions');
      solutions.push('Ensure sufficient disk space available');
      solutions.push('Verify file paths are correct');
    }

    return solutions;
  }
}

// Retry logic for transient errors
export class RetryHandler {
  constructor(logger, maxRetries = 3, baseDelay = 1000) {
    this.logger = logger;
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
  }

  async withRetry(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.debug(`Attempting operation (${attempt}/${this.maxRetries})`, context);
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (this.shouldRetry(error) && attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          this.logger.warn(`Operation failed, retrying in ${delay}ms (${attempt}/${this.maxRetries})`, {
            ...context,
            error: error.message,
            attempt,
            delay
          });
          
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }
    
    this.logger.error(`Operation failed after ${this.maxRetries} attempts`, {
      ...context,
      error: lastError.message,
      attempts: this.maxRetries
    });
    
    throw lastError;
  }

  shouldRetry(error) {
    // Retry on network errors, timeouts, and temporary failures
    const retryableErrors = [
      'ECONNREFUSED',
      'ENOTFOUND', 
      'TIMEOUT',
      'ECONNRESET',
      'NETWORK_ERROR'
    ];
    
    return retryableErrors.some(code => 
      error.code === code || 
      error.message.includes(code) ||
      (error.response && error.response.status >= 500)
    );
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * delay;
    return Math.round(delay + jitter);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global error handlers
export function setupGlobalErrorHandlers(logger) {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception occurred', {
      error: error.message,
      stack: error.stack,
      type: 'uncaught_exception'
    });
    
    // Graceful shutdown
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection occurred', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      type: 'unhandled_rejection'
    });
  });

  process.on('warning', (warning) => {
    logger.warn('Node.js warning occurred', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
      type: 'node_warning'
    });
  });
}

export default {
  N8nFlowManagerError,
  ConfigurationError,
  N8nConnectionError,
  WorkflowError,
  GitError,
  ValidationError,
  FileSystemError,
  ErrorHandler,
  RetryHandler,
  setupGlobalErrorHandlers
};