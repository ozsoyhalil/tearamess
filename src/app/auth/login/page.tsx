'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from '@/lib/services/auth'
import { loginSchema, LoginInput } from '@/lib/schemas/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginInput) => {
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setError('root', { message: 'E-posta veya şifre hatalı.' })
      return
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold italic transition-colors text-caramel"
          >
            tearamess
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1 text-espresso">
            Tekrar Hoş Geldin
          </h1>
          <p className="text-sm text-warmgray-500">Mekanların seni bekliyor.</p>
        </div>

        <div
          className="rounded-2xl p-8 border bg-white border-warmgray-200 shadow-sm"
          style={{ boxShadow: '0 4px 24px rgba(75,46,43,0.09)' }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="email"
              label="E-posta"
              id="email"
              {...register('email')}
              placeholder="ornek@email.com"
              error={errors.email?.message}
            />

            <Input
              type="password"
              label="Şifre"
              id="password"
              {...register('password')}
              placeholder="••••••••"
              error={errors.password?.message}
            />

            {errors.root && (
              <p className="text-sm text-red-400">{errors.root.message}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-semibold transition-all duration-200 bg-caramel text-cream hover:bg-caramel-dark disabled:bg-warmgray-300 disabled:cursor-not-allowed"
              style={{ boxShadow: isSubmitting ? 'none' : '0 4px 14px rgba(192,133,82,0.35)' }}
            >
              {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5 text-warmgray-500">
          Hesabın yok mu?{' '}
          <Link
            href="/auth/register"
            className="font-semibold transition-colors text-caramel"
          >
            Kayıt Ol
          </Link>
        </p>
      </div>
    </div>
  )
}
