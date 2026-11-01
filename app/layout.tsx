import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { DemoBar, Toasts } from '@/components/ui'
import './globals.css'

const display = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['italic', 'normal'], variable: '--font-serif', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Oliveira OKL · Atacado de lupas e acessórios',
  description: 'Demonstração da nova experiência de compra da Oliveira OKL. Atacado a partir de 6 peças, pode mesclar modelos.',
  robots: { index: false, follow: false },
  icons: { icon: '/logo.png' },
}

export const viewport: Viewport = { themeColor: '#0a0a0b', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        {children}
        <DemoBar />
        <Toasts />
      </body>
    </html>
  )
}
