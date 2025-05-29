import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'  // ← THIS IS CRITICAL!

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vaarun C - Software Developer',
  description: 'Portfolio website of Vaarun C, a passionate software developer specializing in full-stack development.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}