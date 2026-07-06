// ============================================================
// ISIP — Auth Validation Schemas
// ============================================================

import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30),
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    role: z.enum(['ADMIN', 'SAFETY_OFFICER', 'OPERATOR', 'TECHNICIAN', 'VIEWER']).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
};

export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};
