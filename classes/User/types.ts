import { z } from 'zod'

export const privateState = z.object({
    email: z.string().email(),
    userId: z.string()
})

export type PrivateState = z.infer<typeof privateState>