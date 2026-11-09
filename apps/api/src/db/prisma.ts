import { PrismaClient, type Prisma } from '@prisma/client';
import { env, isProduction } from '../config/env';

export const prisma = new PrismaClient({
  // Normalised from the Azure ODBC/ADO.NET format if needed (see config/database-url.ts).
  datasourceUrl: env.DATABASE_URL,
  log: isProduction ? ['error'] : ['warn', 'error'],
});

/** Either the root client or an interactive-transaction client. */
export type DbClient = PrismaClient | Prisma.TransactionClient;
