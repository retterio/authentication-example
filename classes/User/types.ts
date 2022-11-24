import { z } from 'zod'

export const privateState = z.object({
    email: z.string().email(),
    userId: z.string()
})

export const userInitModel = z.object({
    email: z.string().email()
})


export type PrivateState = z.infer<typeof privateState>
export type UserInitModel = z.infer<typeof userInitModel>