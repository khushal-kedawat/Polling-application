import { z } from 'zod';

export const createPollSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  responseMode: z.enum(['anonymous', 'authenticated']),
  expiresAt: z
    .string()
    .datetime({ offset: true })
    .refine((s) => new Date(s).getTime() > Date.now(), {
      message: 'expiresAt must be in the future',
    }),
  questions: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(500),
        isRequired: z.boolean().default(false),
        options: z
          .array(z.object({ text: z.string().trim().min(1).max(200) }))
          .min(2, 'Each question needs at least 2 options')
          .max(20),
      }),
    )
    .min(1, 'At least one question is required')
    .max(50),
});

export const updatePollSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  responseMode: z.enum(['anonymous', 'authenticated']).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
});

export const submitResponseSchema = z.object({
  respondentToken: z.string().min(6).max(64).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid(),
        selectedOptionId: z.string().uuid().optional().nullable(),
      }),
    )
    .min(1),
});
