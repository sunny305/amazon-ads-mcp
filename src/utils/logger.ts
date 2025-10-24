/**
 * Simple logger utility for MCP server
 */

export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: any): void;
  debug(message: string, ...args: any[]): void;
  withTool(toolName: string): Logger;
}

export interface LoggerConfig {
  service: string;
  tool?: string;
}

class LoggerImpl implements Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    const tool = this.config.tool ? `[${this.config.tool}]` : '';
    return `[${timestamp}] [${this.config.service}]${tool} [${level}] ${message}`;
  }

  info(message: string, ...args: any[]): void {
    console.log(this.formatMessage('INFO', message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.warn(this.formatMessage('WARN', message), ...args);
  }

  error(message: string, error?: any): void {
    console.error(this.formatMessage('ERROR', message));
    if (error) {
      if (error.response) {
        console.error('Response error:', {
          status: error.response.status,
          data: error.response.data
        });
      } else if (error.message) {
        console.error('Error message:', error.message);
      } else {
        console.error('Error details:', error);
      }
    }
  }

  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  withTool(toolName: string): Logger {
    return new LoggerImpl({
      ...this.config,
      tool: toolName
    });
  }
}

/**
 * Create a logger instance
 */
export function createLogger(config: LoggerConfig): Logger {
  return new LoggerImpl(config);
}
