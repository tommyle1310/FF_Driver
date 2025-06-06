import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN';
  component: string;
  action: string;
  data: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  async log(level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARN', component: string, action: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      action,
      data: data ? JSON.stringify(data, null, 2) : undefined
    };

    this.logs.push(entry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console
    const logMessage = `[${entry.timestamp}] ${level} ${component}::${action}`;
    console.log(logMessage, data || '');

    // Save to AsyncStorage periodically
    if (this.logs.length % 10 === 0) {
      await this.saveLogs();
    }
  }

  async saveLogs() {
    try {
      await AsyncStorage.setItem('debug_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  async loadLogs() {
    try {
      const saved = await AsyncStorage.getItem('debug_logs');
      if (saved) {
        this.logs = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  async exportLogs(): Promise<string> {
    await this.saveLogs();
    return this.logs.map(log => 
      `[${log.timestamp}] ${log.level} ${log.component}::${log.action}\n${log.data ? log.data + '\n' : ''}`
    ).join('\n');
  }

  async clearLogs() {
    this.logs = [];
    await AsyncStorage.removeItem('debug_logs');
  }

  // Convenience methods
  info(component: string, action: string, data?: any) {
    return this.log('INFO', component, action, data);
  }

  error(component: string, action: string, data?: any) {
    return this.log('ERROR', component, action, data);
  }

  debug(component: string, action: string, data?: any) {
    return this.log('DEBUG', component, action, data);
  }

  warn(component: string, action: string, data?: any) {
    return this.log('WARN', component, action, data);
  }
}

export const debugLogger = new DebugLogger();
