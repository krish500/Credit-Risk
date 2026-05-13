import type { Metadata } from 'next'
import { DM_Sans, Fraunces } from 'next/font/google'

import SiteFooter from '@/components/layout/SiteFooter'

import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fr',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Credit Risk Engine - credit risk demo',
  description: 'Course demo: simplified Home Credit slice, XGBoost default risk, SHAP explanations.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col bg-[var(--page)] font-sans text-[var(--fg)] antialiased">
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
