import fs from 'fs';
import path from 'path';
import { BOT_CONFIG } from '../config/bot';

const LOG_FILE = path.join(process.cwd(), 'logs', 'events.json');

interface LogEntry {
  timestamp: string;
  event: string;
  data: Record<string, any>;
}

function ensureLogDir() {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

function readLogs(): LogEntry[] {
  ensureLogDir();
  try {
    if (fs.existsSync(LOG_FILE)) {
      const data = fs.readFileSync(LOG_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading log file:', error);
  }
  return [];
}

export function logEvent(event: string, data: Record<string, any>) {
  // Check if logging is enabled
  if (!BOT_CONFIG.loggingEnabled) {
    console.log(`[LOG] ${event}:`, data);
    return;
  }

  try {
    ensureLogDir();
    const logs = readLogs();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      event,
      data,
    };
    logs.push(entry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    console.log(`[LOG] ${event}:`, data);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}
