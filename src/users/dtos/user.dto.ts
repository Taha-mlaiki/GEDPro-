import { z } from 'zod';

export const createUserSchema = z.object({
  full_name: z.string().min(4, 'Full name must at least contain 4 charachters'),
  email: z.email(),
  password: z
    .string()
    .min(5, { error: 'Error must at least contain 5 charachters' }),
  refreshTokenHash: z.string().optional(),
  role_id: z.number(),
});
export const registerUserSchema = createUserSchema.omit({
  role_id: true,
  refreshTokenHash: true,
});

export type createUserDTO = z.infer<typeof createUserSchema>;
export type registerUserDTO = z.infer<typeof registerUserSchema>;

export const updateUserSchema = createUserSchema
  .omit({ password: true, role_id: true })
  .partial();

export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export const updateUserByAdminSchema = createUserSchema
  .omit({ password: true })
  .partial();

export type UpdateUserByAdminDTO = z.infer<typeof updateUserSchema>;

export const changePasswordSchema = z.object({
  user_id: z.number(),
  old_password: z.string(),
  new_password: z
    .string()
    .min(4, 'password must at least contain 4 characters'),
});

export type changePasswordDTO = z.infer<typeof changePasswordSchema>;
