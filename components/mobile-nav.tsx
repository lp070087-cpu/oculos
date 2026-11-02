'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { Menu, X, type LucideIcon } from 'lucide-react'
import { Logo } from '@/components/ui'

export type NavItem = { href: string; label: string; Icon: LucideIcon; current?: boolean; badge?: number }

/**
 * Menu do celular para painel e conta: barra fixa com o botão no canto superior direito e gaveta lateral.
 * Fecha ao escolher, tocar fora ou apertar Escape, e trava a rolagem do fundo enquanto está aberta.
 * Só aparece onde a barra lateral do desktop some (ver .anav-bar no CSS).
 */
export function MobileNav({ label, items, footer }: { label: string; items: NavItem[]; footer?: (close: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const path = usePathname()
  const btn = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = () => setOpen(false)

  useEffect(close, [path])

  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prev = [html.style.overflow, document.body.style.overflow]
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('[aria-current="page"], a, button')?.focus({ preventScroll: true })
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btn.current?.focus() }
      if (e.key !== 'Tab' || !panel.current) return
      // Mantém o foco dentro da gaveta.
      const f = [...panel.current.querySelectorAll<HTMLElement>('a, button')]
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1)?.focus() }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0]?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { html.style.overflow = prev[0]; document.body.style.overflow = prev[1]; document.removeEventListener('keydown', key) }
  }, [open])

  const current = items.find((i) => i.current)
  const pending = items.reduce((n, i) => n + (i.badge ?? 0), 0)

  return (
    <>
      <div className="anav-bar">
        <Logo size={30} />
        <span className="anav-here">{current?.label}</span>
        <button ref={btn} type="button" className="anav-btn" aria-expanded={open} aria-controls={id} aria-label={`Abrir menu: ${label}`} onClick={() => setOpen(true)}>
          <Menu size={22} aria-hidden />
          {pending > 0 && <em aria-hidden>{pending}</em>}
        </button>
      </div>
      <div className={`anav-back ${open ? 'on' : ''}`} onClick={close} aria-hidden />
      <div ref={panel} id={id} className={`anav-panel ${open ? 'on' : ''}`} role="dialog" aria-modal="true" aria-label={label} inert={!open}>
        <div className="anav-head">
          <Logo size={32} />
          <button type="button" className="anav-btn" onClick={() => { close(); btn.current?.focus() }} aria-label="Fechar menu"><X size={22} aria-hidden /></button>
        </div>
        <nav aria-label={label}>
          {items.map(({ href, label: l, Icon, current: on, badge }) => (
            <Link key={href} href={href} aria-current={on ? 'page' : undefined} onClick={close}>
              <Icon size={18} aria-hidden /> <span>{l}</span>
              {!!badge && <em>{badge}</em>}
            </Link>
          ))}
        </nav>
        {footer && <div className="anav-foot">{footer(close)}</div>}
      </div>
    </>
  )
}
