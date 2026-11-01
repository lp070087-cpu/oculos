'use client'

import { useEffect, useRef } from 'react'

const GOLD = '217,180,65'
const LEVELS = 8

/**
 * Parafuso horizontal em Canvas: barras de tamanhos fixos presas a duas roscas que
 * contornam um cilindro invisível. Quem gira é o cilindro: cada barra passa pela frente
 * (maior, mais brilhante) e por trás (menor, apagada) sem mudar o próprio tamanho.
 */
export function Helix({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let W = 0
    let H = 0
    let raf = 0
    let last = 0

    const size = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      W = r.width
      H = r.height
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H)
      const cy = H / 2
      const radius = H * 0.27
      const gap = W < 700 ? 4 : 5
      const count = Math.ceil(W / gap) + 2
      const turns = (Math.PI * 2 * gap) / Math.max(70, W / 15)
      const buckets: number[][] = Array.from({ length: LEVELS }, () => [])

      for (let i = -1; i < count; i++) {
        for (const thread of [0, Math.PI]) {
          const a = i * turns + thread - t * 2.6
          const z = Math.cos(a)
          const near = 1 / (1 - 0.34 * z)
          const profile = 0.3 + 0.7 * Math.abs(Math.sin(i * 0.083 + thread) * Math.sin(i * 0.031 + 1))
          const h = H * 0.3 * profile * near
          const w = Math.max(1, gap * 0.3 * near)
          const x = i * gap + z * gap * 1.4
          const y = cy + radius * Math.sin(a) * near
          const level = Math.min(LEVELS - 1, Math.floor(((z + 1) / 2) * LEVELS))
          buckets[level].push(x - w / 2, y - h / 2, w, h)
        }
      }

      buckets.forEach((bars, level) => {
        const depth = level / (LEVELS - 1)
        ctx.fillStyle = `rgba(${GOLD},${(0.14 + 0.86 * depth * depth).toFixed(3)})`
        for (let i = 0; i < bars.length; i += 4) ctx.fillRect(bars[i], bars[i + 1], bars[i + 2], bars[i + 3])
      })
    }

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 28) return
      last = now
      draw(now / 1000)
    }

    size()
    draw(0)

    const ro = new ResizeObserver(() => { size(); draw(last / 1000) })
    ro.observe(canvas)
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf)
      if (e.isIntersecting && !still) raf = requestAnimationFrame(frame)
    })
    io.observe(canvas)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return <canvas ref={ref} className={`helix ${className}`} aria-hidden="true" />
}
