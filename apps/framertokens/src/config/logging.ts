/**
 * Logging Configuration Module
 * 
 * Provides structured logging across the plugin with different log levels
 * and categories for better debugging and development experience.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
}

export const LOGGING_CONFIG: Record<string, LogConfig> = {
  initialization: {
    enabled: true,
    level: 'info'
  },
  themeManagement: {
    enabled: true,
    level: 'info'
  },
  tokenSetManagement: {
    enabled: true,
    level: 'info'
  },
  stateManagement: {
    enabled: true,
    level: 'info'
  },
  tokenResolution: {
    enabled: true,
    level: 'debug'
  },
  storage: {
    enabled: true,
    level: 'info'
  },
  sync: {
    enabled: true,
    level: 'info'
  }
};

class Logger {
  private static instance: Logger;
  
  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  private shouldLog(category: string, _level: LogLevel): boolean {
    if (import.meta.env.DEV) {
      return true;
    }
    
    const config = LOGGING_CONFIG[category];
    return config?.enabled ?? false;
  }

  group(category: string, name: string) {
    if (this.shouldLog(category, 'info')) {
      console.group(`[${category}] ${name}`);
    }
  }

  groupEnd(category: string) {
    if (this.shouldLog(category, 'info')) {
      console.groupEnd();
    }
  }

  info(category: string, message: string, ...args: any[]) {
    if (this.shouldLog(category, 'info')) {
      console.log(`[${category}] ${message}`, ...args);
    }
  }

  debug(category: string, message: string, ...args: any[]) {
    if (this.shouldLog(category, 'debug')) {
      console.debug(`[${category}] ${message}`, ...args);
    }
  }

  warn(category: string, message: string, ...args: any[]) {
    if (this.shouldLog(category, 'warn')) {
      console.warn(`[${category}] ${message}`, ...args);
    }
  }

  error(category: string, message: string, ...args: any[]) {
    if (this.shouldLog(category, 'error')) {
      console.error(`[${category}] ${message}`, ...args);
    }
  }
}

export const logger = Logger.getInstance();

// Usage example:
/*
import { logger } from '../config/logging';

// Initialization logs
logger.group('initialization', 'Plugin Startup');
logger.info('initialization', 'Loading themes:', themes);
logger.info('initialization', 'Initial state loaded');
logger.groupEnd('initialization');

// Theme management logs
logger.info('themeManagement', 'Theme changed:', newTheme);

// Error logging
logger.error('tokenResolution', 'Failed to resolve token:', error);
*/
