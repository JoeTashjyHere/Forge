import { z } from 'zod';
import { PROJECT_VISIBILITY } from '@/lib/constants';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const basicInfoSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  location: z.string().min(1, 'Required'),
  timezone: z.string().min(1, 'Required'),
  occupation: z.string().min(1, 'Required'),
  yearsExperience: z.number().min(0, 'Required').max(60, 'Enter a realistic number'),
});
export type BasicInfoInput = z.infer<typeof basicInfoSchema>;

/** Optional ISO date (YYYY-MM-DD). Empty string is treated as no date. */
const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use format YYYY-MM-DD')
  .or(z.literal(''))
  .optional();

export const milestoneSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().max(1000).optional(),
  dueDate: optionalDate,
  status: z.enum(['not_started', 'in_progress', 'completed', 'blocked']),
  completionPercentage: z.number().int().min(0).max(100),
});
export type MilestoneFormInput = z.infer<typeof milestoneSchema>;

export const taskSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(120),
  description: z.string().max(1000).optional(),
  dueDate: optionalDate,
  status: z.enum(['todo', 'in_progress', 'done', 'blocked']),
  priority: z.enum(['low', 'medium', 'high']),
  assignedUserId: z.string().nullable().optional(),
});
export type TaskFormInput = z.infer<typeof taskSchema>;

export const messageSchema = z.object({
  body: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
});
export type MessageInput = z.infer<typeof messageSchema>;

/** Lightweight guard used by chat inputs before sending. */
export function isValidMessageBody(body: string): boolean {
  return messageSchema.safeParse({ body }).success;
}

export const roadmapSchema = z.object({
  summary: z.string().min(1),
  stage: z.string().default(''),
  recommended_team: z
    .array(z.object({ role: z.string().min(1), reason: z.string().default('') }))
    .default([]),
  risks: z
    .array(
      z.object({
        risk: z.string().min(1),
        severity: z.enum(['low', 'medium', 'high']).catch('medium'),
        mitigation: z.string().default(''),
      }),
    )
    .default([]),
  weeks: z
    .array(
      z.object({
        week: z.number().int(),
        goal: z.string().default(''),
        milestones: z.array(z.string()).default([]),
        tasks: z.array(z.string()).default([]),
      }),
    )
    .default([]),
  next_action: z.string().default(''),
});

export const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(80),
  description: z.string().min(10, 'Add a short description').max(2000),
  industry: z.string().min(1, 'Select an industry'),
  stage: z.string().min(1, 'Select a stage'),
  visibility: z.enum(PROJECT_VISIBILITY),
  timeCommitment: z.string().optional(),
  lookingForMembers: z.boolean(),
});
export type ProjectInput = z.infer<typeof projectSchema>;
