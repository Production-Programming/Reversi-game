const winston = require('winston');
const { combine, timestamp, printf } = winston.format;
const DailyRotateFile = require('winston-daily-rotate-file');

const myFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

const transportError = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log', 
  datePattern: 'YYYY-MM-DD',        
  level: 'error',
  maxSize: '20m',                    
  maxFiles: '14d'                    
});

const transportCombined = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d'
});

const logger = winston.createLogger({
  level: 'debug',
  format: combine(timestamp(), myFormat),
  transports: [
    transportError,
    transportCombined
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
