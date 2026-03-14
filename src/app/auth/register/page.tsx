'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUp } from '@/lib/services/auth'
import { registerSchema, RegisterInput } from '@/lib/schemas/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterInput) => {
    const { error } = await signUp(values.email, values.password, {
      username: values.username,
      display_name: values.displayName || values.username,
    })
    if (error) {
      setError('root', { message: error })
      return
    }
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-cream">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold italic transition-colors text-caramel"
          >
            tearamess
          </Link>
          <h1 className="text-2xl font-bold mt-4 mb-1 text-espresso">
            Tearamess&apos;e Katıl
          </h1>
          <p className="text-sm text-warmgray-500">Mekanlarını keşfet, paylaş, listele.</p>
        </div>

        <div
          className="rounded-2xl p-8 border bg-white border-warmgray-200 shadow-sm"
          style={{ boxShadow: '0 4px 24px rgba(75,46,43,0.09)' }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="text"
              label="Kullanıcı Adı"
              id="username"
              {...register('username')}
              placeholder="kullaniciadi"
              error={errors.username?.message}
            />

            <Input
              type="text"
              label="Görünen Ad"
              id="displayName"
              {...register('displayName')}
              placeholder="Adın Soyadın"
              error={errors.displayName?.message}
            />

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
              placeholder="En az 6 karakter"
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
              {isSubmitting ? 'Kayıt yapılıyor…' : 'Kayıt Ol'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-5 text-warmgray-500">
          Zaten hesabın var mı?{' '}
          <Link
            href="/auth/login"
            className="font-semibold transition-colors text-caramel"
          >
            Giriş Yap
          </Link>
        </p>
      </div>
    </div>
  )
}
