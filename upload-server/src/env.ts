import { z } from 'zod'

const envShema = z.object({
  PORT: z.coerce.number().default(3334),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('production'),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
})

export const env = envShema.parse(process.env)
