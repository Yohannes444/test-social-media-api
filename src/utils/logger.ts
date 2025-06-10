import fs from 'fs';
import path from 'path';

const logFile = path.join(__dirname, '../../log.txt');

export const logger = {
  info: (message: string) => {
    const logMessage = `[${new Date().toISOString()}] INFO: ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
  },
  error: (message: string) => {
    const logMessage = `[${new Date().toISOString()}] ERROR: ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
  },
};