import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name required').max(120),
  email: z.string().trim().email('Valid email required'),
  password: z.string().min(6, 'At least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email required'),
  password: z.string().min(1, 'Password required'),
});

export const pollFormSchema = z.object({
  title: z.string().trim().min(1, 'Title required').max(200),
  description: z.string().trim().max(2000).optional(),
  responseMode: z.enum(['anonymous', 'authenticated']),
  expiresAt: z
    .string()
    .min(1, 'Expiry required')
    .refine((v) => new Date(v).getTime() > Date.now(), 'Expiry must be in the future'),
  questions: z
    .array(
      z.object({
        text: z.string().trim().min(1, 'Question text required').max(500),
        isRequired: z.boolean(),
        options: z
          .array(z.object({ text: z.string().trim().min(1, 'Option text required').max(200) }))
          .min(2, 'At least 2 options')
          .max(20),
      }),
    )
    .min(1, 'At least one question'),
});
