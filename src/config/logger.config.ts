import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

/**
 * Logger Configuration
 *
 * Provides structured JSON logging suitable for:
 * - Local development (pretty-printed)
 * - Cloud platforms (GCP Cloud Logging, AWS CloudWatch, Datadog)
 *
 * Log levels: error, warn, info, debug
 *
 * In production, logs are JSON formatted for easy parsing by log aggregators.
 */

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Custom format for cloud platforms
const cloudFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Pretty format for local development
const devFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  utilities.format.nestLike('MeetMeAt', {
    prettyPrint: true,
    colors: true,
  }),
);

export const createLoggerConfig = () => {
  return WinstonModule.createLogger({
    level: isProduction ? 'info' : 'debug',
    silent: isTest,
    transports: [
      new winston.transports.Console({
        format: isProduction ? cloudFormat : devFormat,
      }),
    ],
    // Add metadata to all logs
    defaultMeta: {
      service: 'meetmeat-backend',
      version: process.env.npm_package_version || '0.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });
};

/**
 * Example log output in production (JSON):
 * {
 *   "level": "info",
 *   "message": "Profile created",
 *   "timestamp": "2025-01-15T10:30:00.000Z",
 *   "service": "meetmeat-backend",
 *   "version": "1.0.0",
 *   "environment": "production",
 *   "profileId": "uuid-here",
 *   "userId": "uuid-here"
 * }
 *
 * Datadog Integration:
 * - Set DD_SERVICE, DD_ENV, DD_VERSION env vars
 * - JSON logs are automatically parsed
 *
 * GCP Cloud Logging:
 * - JSON logs are automatically structured
 * - Use "severity" field mapping if needed
 *
 * AWS CloudWatch:
 * - JSON logs work out of the box
 * - Consider adding request_id for tracing
 */
