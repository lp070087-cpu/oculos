'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PlayCircle, Store, UserRound } from 'lucide-react'
import { useUi } from '@/lib/ui'
import type { OrderStatus, PaymentStatus } from '@/lib/demo/types'

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <Link href="/" className="logo" aria-label="Oliveira OKL, página inicial">
      <img src="/logo.png" alt="" width={size} height={Math.round((size * 151) / 145)} />
      <span>OLIVEIRA <b>OKL</b></span>
    </Link>
  )
}

/** Faixa de ondas determinística: a mesma "assinatura" para a mesma semente. */
export function Wave({ seed = 7, bars = 96, className = '' }: { seed?: number; bars?: number; className?: string }) {
  const hs = Array.from({ length: bars }, (_, i) => {
    const x = i / bars
    const v = Math.abs(Math.sin(x * 19 + seed) * Math.sin(x * 7.3 + seed * 2)) * 0.8 + Math.abs(Math.sin(x * 53 + seed)) * 0.2
    return Math.max(0.06, v)
  })
  return (
    <svg className={`wave ${className}`} viewBox={`0 0 ${bars * 4} 40`} preserveAspectRatio="none" aria-hidden="true">
      {hs.map((h, i) => <rect key={i} x={i * 4} y={(20 - h * 20).toFixed(2)} width="1.6" height={(h * 40).toFixed(2)} />)}
    </svg>
  )
}

export function Reveal({ children, className = '', as: Tag = 'div' }: { children: React.ReactNode; className?: string; as?: 'div' | 'section' }) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref as never} className={`reveal ${className}`}>{children}</Tag>
}

export function Toasts() {
  const { toasts } = useUi()
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          <span>{t.text}</span>
          {t.href && <Link href={t.href}>{t.action ?? 'Abrir'}</Link>}
        </div>
      ))}
    </div>
  )
}

const ENVS = [
  { href: '/', label: 'Loja', Icon: Store, match: (p: string) => !p.startsWith('/conta') && !p.startsWith('/painel') && !p.startsWith('/demo') },
  { href: '/conta', label: 'Cliente', Icon: UserRound, match: (p: string) => p.startsWith('/conta') },
  { href: '/painel', label: 'Painel', Icon: LayoutDashboard, match: (p: string) => p.startsWith('/painel') },
  { href: '/demo', label: 'Roteiro', Icon: PlayCircle, match: (p: string) => p.startsWith('/demo') },
]

/** Sempre visível: deixa claro que é demonstração e troca de ambiente em um clique. */
export function DemoBar() {
  const path = usePathname()
  return (
    <nav className="demobar" aria-label="Ambientes da demonstração">
      <span className="demobar-tag">DEMO</span>
      {ENVS.map(({ href, label, Icon, match }) => (
        <Link key={href} href={href} prefetch={false} aria-current={match(path) ? 'page' : undefined}>
          <Icon size={15} aria-hidden /> <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}

export const ORDER_LABEL: Record<OrderStatus, string> = { novo: 'Novo', separacao: 'Em separação', enviado: 'Enviado', entregue: 'Entregue', cancelado: 'Cancelado' }
export const PAY_LABEL: Record<PaymentStatus, string> = { pendente: 'Pendente', pago: 'Pago (teste)', recusado: 'Recusado' }

export function Pill({ tone = 'neutral', children }: { tone?: 'neutral' | 'gold' | 'ok' | 'warn' | 'bad' | 'violet'; children: React.ReactNode }) {
  return <span className={`pill pill-${tone}`}>{children}</span>
}

export const orderTone = (s: OrderStatus) => ({ novo: 'gold', separacao: 'violet', enviado: 'neutral', entregue: 'ok', cancelado: 'bad' } as const)[s]
export const payTone = (s: PaymentStatus) => ({ pendente: 'warn', pago: 'ok', recusado: 'bad' } as const)[s]

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])
  return (
    <div className="modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Fechar">×</button></header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
