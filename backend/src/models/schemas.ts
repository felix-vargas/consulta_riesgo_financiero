import { z } from 'zod';

export const loginRequestSchema = z
    .object({
        username: z
            .string({ error: 'El usuario es obligatorio.' })
            .trim()
            .min(1, 'El usuario no puede estar vacío.')
            .max(64, 'El identificador excede el largo máximo permitido.'),
        password: z
            .string({ error: 'La contraseña es obligatoria.' })
            .min(1, 'La contraseña no puede estar vacía.')
            .max(128, 'La contraseña excede el largo máximo permitido.'),
    })
    .strict();

export type LoginRequestDto = z.infer<typeof loginRequestSchema>;
