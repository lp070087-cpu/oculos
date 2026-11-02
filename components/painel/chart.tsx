'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { brl } from '@/lib/catalog'
import { demo } from '@/lib/demo/store'
import { fmtDate, toast } from '@/lib/ui'

/** Escala de desempenho. Só indica resultado contra a meta; a identidade do painel segue preta e amarela. */
export const TIERS = [
  { min: 1.3, label: 'Excelente', range: '130% ou mais', color: '#328B66' },
  { min: 1, label: 'Bom', range: '100% a 129%', color: '#80B77A' },
  { min: 0.7, label: 'Próximo da meta', range: '70% a 99%', color: '#DDBB49' },
  { min: 0.4, label: 'Regular', range: '40% a 69%', color: '#D99A4E' },
  { min: 0, label: 'Abaixo da meta', range: 'menos de 40%', color: '#D75C56' },
] as const

export const tierOf = (ratio: number) => TIERS.find((t) => ratio >= t.min) ?? TIERS[TIERS.length - 1]

type Point = { to: number; value: number; count?: number }

/**
 * Escala automática da régua: passo "redondo" (1, 2, 2,5 ou 5 × 10ⁿ) em até 4 intervalos,
 * sempre cobrindo o maior valor exibido e a meta. Nada fica cortado se as vendas crescerem.
 */
export function scale(max: number) {
  const raw = Math.max(max, 1) / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag
  const n = Math.max(1, Math.ceil(max / step - 1e-9))
  return { top: step * n, ticks: Array.from({ length: n + 1 }, (_, i) => i * step) }
}
const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
/** Versão curta para o celular: R$ 750, R$ 1,5k. */
const short = (v: number) => (v >= 1000 ? `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k` : `R$ ${v}`)
const pct = (n: number) => `${Math.round(n * 100)}%`

/** Barras por dia coloridas pela meta diária. Tooltip no mouse, no toque e no foco do teclado. */
export function SalesChart({ data, compare, goal }: { data: Point[]; compare?: Point[]; goal: number }) {
  const [on, setOn] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { top: max, ticks } = scale(Math.max(goal, ...data.map((d) => d.value), ...(compare ?? []).map((d) => d.value)))
  const h = (v: number) => `${(v / max) * 100}%`

  useEffect(() => {
    if (on === null) return
    const out = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOn(null) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOn(null) }
    document.addEventListener('pointerdown', out)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', out); document.removeEventListener('keydown', esc) }
  }, [on])

  const d = on === null ? null : data[on]
  const prev = on === null ? undefined : compare?.[on]
  const t = d && tierOf(d.value / goal)

  return (
    <figure className="sc">
      <div className="sc-frame">
      <div className="sc-y" aria-hidden>
        {ticks.map((v) => <span key={v} style={{ bottom: h(v) }}><b>{money(v)}</b><i>{short(v)}</i></span>)}
      </div>
      <div className="sc-plot" ref={ref} onMouseLeave={() => setOn(null)}>
        <div className="sc-area" aria-hidden>
          {ticks.map((v) => <div key={v} className="sc-grid" style={{ bottom: h(v) }} />)}
          <div className="sc-goal" style={{ bottom: h(goal) }}><span>Meta {brl(goal)}</span></div>
        </div>
        {data.map((p, i) => {
          const r = p.value / goal
          const c = tierOf(r)
          const label = `${fmtDate(p.to)}: ${brl(p.value)}, ${pct(r)} da meta, ${c.label.toLowerCase()}${compare ? `. Período anterior: ${brl(compare[i].value)}` : ''}`
          return (
            <button
              key={p.to} type="button" className={`sc-col ${on === i ? 'on' : ''}`} aria-label={label}
              style={{ '--i': i } as CSSProperties}
              onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} onClick={() => setOn(i)}
            >
              <span className="sc-bars">
                {compare && <i className="sc-bar alt" style={{ height: h(compare[i].value) }} />}
                <i className="sc-bar" style={{ height: h(p.value), '--c': c.color } as CSSProperties} />
              </span>
              <span className="sc-x">{new Date(p.to).getUTCDate()}</span>
            </button>
          )
        })}
        {d && t && (
          // Ao lado da barra, para não cobrir a própria barra nem o cabeçalho do painel.
          <div className="sc-tip" aria-hidden style={on! < data.length / 2 ? { left: `calc(${((on! + 1) / data.length) * 100}% + 6px)` } : { right: `calc(${((data.length - on!) / data.length) * 100}% + 6px)` }}>
            <b>{fmtDate(d.to)}</b>
            <span className="sc-tip-v">{brl(d.value)}</span>
            <span><i style={{ background: t.color }} />{pct(d.value / goal)} da meta · {t.label}</span>
            {d.count !== undefined && <small>{d.count} {d.count === 1 ? 'pedido' : 'pedidos'}</small>}
            {prev && <small>Período anterior ({fmtDate(prev.to)}): {brl(prev.value)}</small>}
          </div>
        )}
      </div>
      </div>
      <figcaption className="sc-legend">
        {[...TIERS].reverse().map((x) => <span key={x.label} title={x.range}><i style={{ background: x.color }} />{x.label}</span>)}
        <span><i className="sc-key-goal" />Meta diária</span>
        {compare && <span><i className="sc-key-alt" />Período anterior</span>}
      </figcaption>
    </figure>
  )
}

/** Meta diária editável. Fica salva na demonstração e recolore os gráficos na hora. */
export function GoalSetting({ goal }: { goal: number }) {
  const [v, setV] = useState(String(goal))
  useEffect(() => setV(String(goal)), [goal])
  const save = () => {
    const n = Number(v.replace(/\./g, '').replace(',', '.'))
    if (!(n > 0)) { setV(String(goal)); return }
    if (Math.round(n) !== goal) { demo.setSalesGoal(n); toast(`Meta diária: ${brl(Math.round(n))}`) }
  }
  return (
    <form className="goal" onSubmit={(e) => { e.preventDefault(); save() }}>
      <label htmlFor="goal-in">Meta diária</label>
      <span><em>R$</em><input id="goal-in" inputMode="numeric" value={v} onChange={(e) => setV(e.target.value)} onBlur={save} /></span>
    </form>
  )
}
