import { Prisma } from '@prisma/client';
import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { MongoServerSelectionError } from 'mongodb';
import type { ApiErrorBody, HealthStatus } from '@sajag/shared';
import { allowedOrigins } from './config/env';
import { connectMongo } from './db/mongo';
import { prisma } from './db/prisma';
import { asyncHandler } from './lib/http';
import { AppError } from './lib/errors';
import { logger } from './lib/logger';
import { apiLimiter } from './lib/rate-limit';
import { authRouter } from './modules/auth/auth.routes';
import { adminCampaignRouter } from './modules/campaigns/campaign.routes';
import { otpRouter } from './modules/otp/otp.routes';
import { publicRouter } from './modules/participation/public.routes';
import { privacyRouter } from './modules/privacy/privacy.routes';
import { adminUsersRouter } from './modules/auth/admin-users.routes';

const errorBody = (code: string, message: string, details?: unknown): ApiErrorBody => ({
  error: { code, message, ...(details === undefined ? {} : { details }) },
});

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.status).json(errorBody(error.code, error.message, error.details));
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    res.status(409).json(errorBody('conflict', 'This record already exists'));
    return;
  }
  if (error instanceof MongoServerSelectionError) {
    logger.error('Document store unreachable');
    res.status(503).json(errorBody('service_unavailable', 'सेवा अस्थायी रूप से उपलब्ध नहीं है। कृपया थोड़ी देर बाद प्रयास करें।'));
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json(errorBody('bad_request', 'Malformed JSON body'));
    return;
  }
  logger.error({ err: error }, 'Unhandled error');
  res.status(500).json(errorBody('internal_error', 'Something went wrong. Please try again.'));
};

export function createApp(): express.Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // Render terminates TLS in front of the service

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin)),
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const api = express.Router();
  api.use(apiLimiter);
  // Readiness: confirms both databases answer. Used by the admin dashboard status banner.
  api.get(
    '/health',
    asyncHandler(async (_req, res) => {
      const [sql, documentDb] = await Promise.allSettled([
        prisma.$queryRaw`SELECT 1`,
        connectMongo().then((db) => db.command({ ping: 1 })),
      ]);
      const status: HealthStatus = {
        sql: sql.status === 'fulfilled' ? 'up' : 'down',
        documentDb: documentDb.status === 'fulfilled' ? 'up' : 'down',
      };
      res.status(status.sql === 'up' && status.documentDb === 'up' ? 200 : 503).json(status);
    }),
  );
  api.use('/public', publicRouter);
  api.use('/otp', otpRouter);
  api.use('/admin/auth', authRouter);
  api.use('/admin/users', adminUsersRouter);
  api.use('/admin/campaigns', adminCampaignRouter);
  api.use('/admin/privacy', privacyRouter);
  api.use((_req, res) => {
    res.status(404).json(errorBody('not_found', 'Route not found'));
  });

  app.use('/api', api);
  app.use(errorHandler);
  return app;
}
