import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email().min(3, 'password is required'),
  password: z.string().min(1, 'Password is required'),
});

export type loginDTO = z.infer<typeof loginSchema>;
