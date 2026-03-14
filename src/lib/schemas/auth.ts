import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalı')
    .regex(/^[a-z0-9_]+$/, 'Yalnızca küçük harf, rakam ve _ kullanılabilir'),
  displayName: z.string().optional(),
  email: z.string().email('Geçerli bir e-posta girin'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı'),
})
export type RegisterInput = z.infer<typeof registerSchema>
