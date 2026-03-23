import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Tearamess',
  description: 'Mekanlar için Letterboxd',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="bottom-center" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
