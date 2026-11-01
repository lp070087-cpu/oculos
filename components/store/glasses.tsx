'use client'

import { useEffect, useRef, useState } from 'react'
import { MoveHorizontal } from 'lucide-react'

const PAIRS = [{ id: 'ruby', depth: 1, phase: 0 }]

/**
 * A loja só tem fotos frontais destes modelos, então a rotação é limitada.
 * Um giro de 360° exige fotos de múltiplos ângulos ou um modelo 3D: basta trocar
 * esta camada por uma sequência de imagens quando esses arquivos existirem.
 */
const MAX_ANGLE = 32

export function FloatingGlasses({ active, onDrag }: { active: boolean; onDrag: (dragging: boolean) => void }) {
  const stage = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; base: number } | null>(null)
  const target = useRef(0)
  const angle = useRef(0)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    const el = stage.current
    if (!el || !active) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const start = performance.now()
    let prev = start
    const tick = (now: number) => {
      const frames = Math.min(6, (now - prev) / 16.7)
      prev = now
      if (!drag.current) target.current *= Math.pow(0.94, frames)
      angle.current += (target.current - angle.current) * (1 - Math.pow(0.86, frames))
      const t = (now - start) / 1000
      el.style.setProperty('--sheen', `${50 + angle.current * 1.6}%`)
      el.querySelectorAll<HTMLElement>('.gl-pair').forEach((p, i) => {
        const { depth, phase } = PAIRS[i]
        const float = still ? 0 : Math.sin(t * 0.9 + phase) * 7
        const sway = still ? 0 : Math.sin(t * 0.55 + phase) * 1.5
        p.style.transform = `translateY(${float.toFixed(2)}px) rotateY(${(angle.current * depth + sway).toFixed(2)}deg) rotateX(${(sway * 0.5).toFixed(2)}deg)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active])

  const release = () => {
    if (!drag.current) return
    drag.current = null
    onDrag(false)
  }

  return (
    <div className="gl-stage" ref={stage}>
      {PAIRS.map((p) => (
        <div
          key={p.id}
          className={`gl-pair gl-${p.id}`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId)
            drag.current = { x: e.clientX, base: target.current }
            setTouched(true)
            onDrag(true)
          }}
          onPointerMove={(e) => {
            if (!drag.current) return
            const next = drag.current.base + (e.clientX - drag.current.x) * 0.3
            target.current = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, next))
          }}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={release}
        >
          <img src={`/banners/glasses-${p.id}.webp`} alt="" draggable={false} />
          <i style={{ WebkitMaskImage: `url(/banners/glasses-${p.id}.webp)`, maskImage: `url(/banners/glasses-${p.id}.webp)` }} />
        </div>
      ))}
      <span className={`gl-hint ${touched ? 'off' : ''}`}><MoveHorizontal size={15} aria-hidden /> Arraste para girar</span>
    </div>
  )
}
