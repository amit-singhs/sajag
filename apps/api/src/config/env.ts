import { z } from 'zod';
import { normalizeDatabaseUrl } from './database-url';

const booleanString = z.enum(['true', 'false']).transform((v) => v === 'true');
const optional = z.string().trim().optional().transform((v) => (v ? v : undefined));
const withFallback = (fallback: string) => z.string().trim().optional().transform((v) => v || fallback);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  /** Comma-separated list of allowed browser origins (Vercel production + preview domains, localhost). */
  WEB_ORIGINS: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL (Azure SQL) is required').transform(normalizeDatabaseUrl),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI (Azure DocumentDB) is required'),
  MONGODB_DB: z.string().min(1).default('sajag'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  DATA_ENCRYPTION_KEY: z
    .string()
    .refine((v) => Buffer.from(v, 'base64').length === 32, 'DATA_ENCRYPTION_KEY must be 32 bytes, base64-encoded'),
  HASH_PEPPER: z.string().min(32, 'HASH_PEPPER must be at least 32 characters'),

  ADMIN_SEED_EMAIL: optional.pipe(z.string().email().optional()),
  ADMIN_SEED_PASSWORD: optional.pipe(z.string().min(12, 'ADMIN_SEED_PASSWORD must be at least 12 characters').optional()),
  ADMIN_SEED_NAME: z.string().default('Administrator'),
  SEED_SAMPLE_CAMPAIGN: booleanString.default('true'),

  SMS_PROVIDER: z.enum(['console', 'msg91']).default('console'),
  MSG91_AUTH_KEY: optional,
  MSG91_TEMPLATE_ID: optional,

  DIGILOCKER_CLIENT_ID: optional,
  DIGILOCKER_CLIENT_SECRET: optional,
  DIGILOCKER_REDIRECT_URI: optional,

  ORG_NAME: z.string().default('सजग'),
  // Grievance officer (DPDP Rules, rule 9). Empty values fall back to these defaults.
  GRIEVANCE_OFFICER_NAME: withFallback('अमित सिंह सिसौदिआ'),
  GRIEVANCE_OFFICER_EMAIL: withFallback('amitdrive005@gmail.com'),
  GRIEVANCE_OFFICER_PHONE: withFallback(''),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  const value = parsed.data;
  if (value.SMS_PROVIDER === 'msg91' && (!value.MSG91_AUTH_KEY || !value.MSG91_TEMPLATE_ID)) {
    throw new Error('SMS_PROVIDER=msg91 requires MSG91_AUTH_KEY and MSG91_TEMPLATE_ID');
  }
  return value;
}

export const env: Env = loadEnv();
export const isProduction = env.NODE_ENV === 'production';
export const allowedOrigins: string[] = env.WEB_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
