import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
  ENCRYPTION_KEY_AES: z
    .string()
    .length(32, 'ENCRYPTION_KEY_AES deve ter exatamente 32 caracteres (256 bits)')
    .default('01234567890123456789012345678901'),
  WEBHOOK_CRM_SECRET: z.string().optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function carregarEnv(rawEnv: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = EnvSchema.parse(rawEnv);

  if (parsed.NODE_ENV === 'production' && parsed.ENCRYPTION_KEY_AES === '01234567890123456789012345678901') {
    throw new Error('ENCRYPTION_KEY_AES padrão não é permitida em NODE_ENV=production.');
  }

  return parsed;
}

export const env = carregarEnv();
