import { z } from 'zod';

export const loginRequestSchema = z.object({
    username: z
        .string({ required_error: 'El usuario es obligatorio.' })
        .trim()
        .min(1, 'El usuario no puede estar vacío.'),
    password: z
        .string({ required_error: 'La contraseña es obligatoria.' })
        .min(1, 'La contraseña no puede estar vacía.'),
});

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
