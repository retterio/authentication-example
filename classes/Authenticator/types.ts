import { z } from 'zod'

export const initInputModel = z.object({
    email: z.string().email()
})

export const loginModel = z.object({
    otp: z.number()
})

export const privateState = z.object({
    email: z.string().email(),
    otp: z.number()
})


export type InitInputModel = z.infer<typeof initInputModel>
export type Login = z.infer<typeof loginModel>
export type PrivateState = z.infer<typeof privateState>