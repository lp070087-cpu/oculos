'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const TICKS = Array.from({ length: 64 }, (_, i) => i)
const RINGS = [150, 214, 278, 342, 406, 470]

/** Banner institucional: só tipografia e arte vetorial, sem fotografia. */
export function BrandSlide({ active }: { active: boolean }) {
  return (
    <div className="bb">
      <svg className="bb-art" viewBox="0 0 1440 800" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
        <g fill="none" stroke="#111" strokeWidth="1">
          {RINGS.map((r, i) => <circle key={r} cx="1060" cy="400" r={r} opacity={0.14 - i * 0.015} />)}
        </g>
        <g className="bb-spin">
          <circle cx="1060" cy="400" r="278" fill="none" stroke="#d9b441" strokeWidth="2" strokeDasharray="4 16" />
          <circle cx="1338" cy="400" r="7" fill="#d9b441" />
        </g>
        <g className="bb-spin bb-spin-rev">
          <path d="M1060 -70a470 470 0 0 1 470 470" fill="none" stroke="#d9b441" strokeWidth="1.5" />
        </g>
        <g className="bb-ticks">
          {TICKS.map((i) => <rect key={i} x={i * 23} y="0" width="1.5" height={i % 8 === 0 ? 26 : 12} fill={i % 8 === 0 ? '#d9b441' : '#111'} style={{ animationDelay: `${(i % 16) * 0.22}s` }} />)}
        </g>
      </svg>

      <p className="bb-top">OLIVEIRA OKL <i>/</i> ATACADO</p>

      <h2 className="bb-title">
        <span><b>SEU ESTILO<i>.</i></b></span>
        <span><em>SEM FRONTEIRAS<i>.</i></em></span>
      </h2>

      <div className="bb-foot">
        <p className="bb-sub">Óculos para quem quer se destacar. Modelos selecionados, condições de atacado e envios para todo o Brasil.</p>
        <Link className="bb-cta" href="/produtos" prefetch={false} tabIndex={active ? 0 : -1}>
          <span>EXPLORAR COLEÇÃO</span> <ArrowRight size={18} aria-hidden />
        </Link>
        <ul className="bb-info">
          <li>MÍNIMO 6 PEÇAS</li>
          <li>ENVIAMOS PARA TODO O BRASIL</li>
        </ul>
      </div>
    </div>
  )
}
