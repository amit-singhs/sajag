import pino from 'pino';
import { env, isProduction } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Never log personal data: redact common carriers of it.
  redact: ['req.headers.authorization', '*.mobile', '*.password', '*.name', '*.code'],
  ...(isProduction ? {} : { transport: { target: 'pino-pretty', options: { colorize: true } } }),
});
