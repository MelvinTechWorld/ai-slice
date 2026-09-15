// lib/validations/auth.ts
//
// Copied verbatim from Assessment 1. Path kept as "validations" (plural)
// to match Assessment 1's own imports exactly, rather than renaming to
// this repo's "validation" (singular) convention and risking a typo
// across every copied auth file that references this path.

import { z } from 'zod';

// Shared password rules so we don't duplicate them
const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password is too long');

export const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50),
    email: z.string().email('Please enter a valid email address'),
    password: passwordSchema,
});
export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});
export type SigninInput = z.infer<typeof signinSchema>;

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Invalid reset token'),
    password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    code: z.string().length(6, 'Verification code must be exactly 6 digits'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;