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
