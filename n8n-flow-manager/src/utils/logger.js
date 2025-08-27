import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Apply colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// Define different transports
const transports = [
  // Console transport with colors
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'test' ? 'error' : 'info'),
    format: format,
    silent: process.env.NODE_ENV === 'test'
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.resolve(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.resolve(__dirname, '../../logs/combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Create the logger instance
const winstonLogger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports,
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.resolve(__dirname, '../../logs/exceptions.log') 
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.resolve(__dirname, '../../logs/rejections.log') 
    })
  ],
  exitOnError: false
});

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Enhanced logger with additional methods
export class Logger {
  constructor(module = 'n8n-flow-manager') {
    this.module = module;
    this.logger = winstonLogger;
  }

  // Format message with module context
  formatMessage(message, metadata = {}) {
    const modulePrefix = this.module ? `[${this.module}]` : '';
    return {
      message: `${modulePrefix} ${message}`,
      ...metadata,
      module: this.module,
      timestamp: new Date().toISOString()
    };
  }

  // Log methods
  error(message, metadata = {}) {
    this.logger.error(this.formatMessage(message, metadata));
  }

  warn(message, metadata = {}) {
    this.logger.warn(this.formatMessage(message, metadata));
  }

  info(message, metadata = {}) {
    this.logger.info(this.formatMessage(message, metadata));
  }

  http(message, metadata = {}) {
    this.logger.http(this.formatMessage(message, metadata));
  }

  debug(message, metadata = {}) {
    this.logger.debug(this.formatMessage(message, metadata));
  }

  // Convenience methods
  success(message, metadata = {}) {
    this.info(`✅ ${message}`, { ...metadata, type: 'success' });
  }

  failure(message, metadata = {}) {
    this.error(`❌ ${message}`, { ...metadata, type: 'failure' });
  }

  start(operation, metadata = {}) {
    this.info(`🚀 Starting: ${operation}`, { ...metadata, type: 'operation_start', operation });
  }

  complete(operation, metadata = {}) {
    this.info(`✅ Completed: ${operation}`, { ...metadata, type: 'operation_complete', operation });
  }

  // Performance logging
  time(label) {
    this.timers = this.timers || {};
    this.timers[label] = Date.now();
    this.debug(`⏱️ Timer started: ${label}`);
  }

  timeEnd(label) {
    if (!this.timers || !this.timers[label]) {
      this.warn(`Timer '${label}' does not exist`);
      return;
    }
    
    const duration = Date.now() - this.timers[label];
    delete this.timers[label];
    
    this.info(`⏱️ Timer '${label}': ${duration}ms`, { 
      type: 'performance', 
      label, 
      duration 
    });
    
    return duration;
  }

  // API request logging
  apiRequest(method, url, metadata = {}) {
    this.http(`📤 API Request: ${method.toUpperCase()} ${url}`, {
      ...metadata,
      type: 'api_request',
      method: method.toUpperCase(),
      url
    });
  }

  apiResponse(method, url, status, metadata = {}) {
    const statusType = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    const emoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅';
    
    this[statusType](`📥 API Response: ${method.toUpperCase()} ${url} - ${status}`, {
      ...metadata,
      type: 'api_response',
      method: method.toUpperCase(),
      url,
      status
    });
  }

  // Git operations logging
  gitOperation(operation, metadata = {}) {
    this.info(`🔀 Git: ${operation}`, { 
      ...metadata, 
      type: 'git_operation', 
      operation 
    });
  }

  // Workflow operations logging
  workflowOperation(operation, workflowId, metadata = {}) {
    this.info(`🔄 Workflow: ${operation} (${workflowId})`, {
      ...metadata,
      type: 'workflow_operation',
      operation,
      workflowId
    });
  }

  // System events logging
  systemEvent(event, metadata = {}) {
    this.info(`🔧 System: ${event}`, {
      ...metadata,
      type: 'system_event',
      event
    });
  }

  // Security events logging
  securityEvent(event, metadata = {}) {
    this.warn(`🔒 Security: ${event}`, {
      ...metadata,
      type: 'security_event',
      event
    });
  }
}

// Default logger instance
const loggerInstance = new Logger();

// Module-specific logger factory
export const createLogger = (module) => new Logger(module);

// Legacy console replacement (for gradual migration)
export const console = {
  log: (message, ...args) => loggerInstance.info(message, { args }),
  info: (message, ...args) => loggerInstance.info(message, { args }),
  warn: (message, ...args) => loggerInstance.warn(message, { args }),
  error: (message, ...args) => loggerInstance.error(message, { args }),
  debug: (message, ...args) => loggerInstance.debug(message, { args })
};

// Export both named and default exports
export const logger = loggerInstance;
export default loggerInstance;