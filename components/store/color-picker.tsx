'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import type { Product } from '@/lib/catalog'
import { useDemo } from '@/lib/demo/store'

const GAP = 6
const MAX_H = 268

/** Cor do produto. Abre só ao clicar; a lista fica no body para não ser cortada pelo card ou pelo carrossel. */
export function ColorPicker({ options, value, onChange }: { options: Product[]; value: Product; onChange: (p: Product) => void }) {
  const stock = useDemo((s) => s.stock)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number }>({ left: 0, width: 0 })
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  const close = useCallback((refocus = false) => { setOpen(false); if (refocus) btn.current?.focus() }, [])

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = btn.current?.getBoundingClientRect()
      if (!r) return
      const width = Math.min(Math.max(r.width, 220), innerWidth - 16)
      const left = Math.max(8, Math.min(r.left, innerWidth - width - 8))
      const below = innerHeight - r.bottom < MAX_H + GAP && r.top > innerHeight - r.bottom
      setPos(below ? { left, width, bottom: innerHeight - r.top + GAP } : { left, width, top: r.bottom + GAP })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open])

  useEffect(() => {
    if (!open) {
      setShown(false)
      const t = setTimeout(() => setMounted(false), 180)
      return () => clearTimeout(t)
    }
    setMounted(true)
    const raf = requestAnimationFrame(() => {
      setShown(true)
      const items = list.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
      const on = list.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]:not(:disabled)')
      ;(on ?? items?.[0] ?? list.current)?.focus({ preventScroll: true })
      on?.scrollIntoView({ block: 'nearest' })
    })
    const out = (e: PointerEvent) => {
      const t = e.target as Node
      if (!list.current?.contains(t) && !btn.current?.contains(t)) close()
    }
    document.addEventListener('pointerdown', out)
    return () => { cancelAnimationFrame(raf); document.removeEventListener('pointerdown', out) }
  }, [open, close])

  if (options.length < 2) {
    return <p className="cp-solo"><i style={{ background: value.swatch }} aria-hidden /><span>{value.variant}</span></p>
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    const go = (n: number) => { e.preventDefault(); items[(n + items.length) % items.length]?.focus() }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true) }
    else if (e.key === 'Tab') close(true)
    else if (e.key === 'ArrowDown') go(at + 1)
    else if (e.key === 'ArrowUp') go(at - 1)
    else if (e.key === 'Home') go(0)
    else if (e.key === 'End') go(items.length - 1)
  }

  return (
    <div className="cp">
      <button
        ref={btn} type="button" className={`cp-btn ${open ? 'open' : ''}`}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
        aria-label={`Selecionar cor. Cor atual: ${value.variant}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
      >
        <i style={{ background: value.swatch }} aria-hidden />
        <span>{value.variant}</span>
        <ChevronDown size={16} aria-hidden />
      </button>
      {mounted && createPortal(
        <div
          ref={list} id={id} role="listbox" aria-label="Cores disponíveis" tabIndex={-1} onKeyDown={onKey}
          className={`cp-list ${shown ? 'in' : ''} ${pos.bottom !== undefined ? 'up' : ''}`} style={pos}
        >
          {options.map((o) => {
            const off = o.soldOut || (stock[o.slug] ?? 0) <= 0
            const on = o.slug === value.slug
            return (
              <button
                key={o.slug} type="button" role="option" aria-selected={on} disabled={off}
                className={on ? 'on' : ''}
                onClick={() => { onChange(o); close(true) }}
              >
                <i style={{ background: o.swatch }} aria-hidden />
                <span>{o.variant}</span>
                {off ? <small>Esgotado</small> : on && <Check size={16} aria-hidden />}
              </button>
            )
          })}
        </div>,
        document.body,
      )}
    </div>
  )
}
