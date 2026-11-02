'use client'

import Link from 'next/link'
import { useMemo, useState, type MouseEvent } from 'react'
import { Heart, Plus } from 'lucide-react'
import { brl, imgUrl, type Product } from '@/lib/catalog'
import { addAndConfirm, useFamily, demo, useDemo } from '@/lib/demo/store'
import { ColorPicker } from './color-picker'

export function ProductCard({ p: base, large, priority }: { p: Product; large?: boolean; priority?: boolean }) {
  const family = useFamily(base.family)
  const [slug, setSlug] = useState(base.slug)
  const p = useMemo(() => family.find((o) => o.slug === slug) ?? base, [family, slug, base])
  const fav = useDemo((s) => s.favorites.includes(p.slug))
  const stock = useDemo((s) => s.stock[p.slug] ?? 0)
  const out = p.soldOut || stock <= 0
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
  const add = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addAndConfirm(p.slug)
  }
  return (
    <article className={`card ${large ? 'card-lg' : ''}`}>
      <Link href={`/produto/${p.slug}`} prefetch={false} className="card-img" aria-label={p.name}>
        <img src={imgUrl(p.image)} alt={p.name} loading={priority ? 'eager' : 'lazy'} decoding="async" className={out ? 'is-out' : ''} />
        <span className="card-flags">
          {p.limited && <i className="flag flag-gold">Edição limitada</i>}
          {off > 0 && <i className="flag">-{off}%</i>}
          {out && <i className="flag flag-dark">Esgotado</i>}
        </span>
      </Link>
      <button
        className={`card-fav ${fav ? 'on' : ''}`}
        onClick={() => demo.toggleFavorite(p.slug)}
        aria-label={fav ? `Remover ${p.name} dos favoritos` : `Favoritar ${p.name}`}
        aria-pressed={fav}
      >
        <Heart size={17} fill={fav ? 'currentColor' : 'none'} />
      </button>
      <div className="card-body">
        <Link href={`/produto/${p.slug}`} prefetch={false}>
          <span className="card-fam">{p.family}</span>
          <h3>{p.variant}</h3>
        </Link>
        <div className="card-opts">
          <ColorPicker options={family} value={p} onChange={(o) => setSlug(o.slug)} />
        </div>
        <div className="card-foot">
          <p>{p.oldPrice && <s>{brl(p.oldPrice)}</s>}<b>{brl(p.price)}</b></p>
          {!out && (
            <button type="button" className="card-add" aria-label={`Adicionar ${p.name} ao pedido`} onClick={add}>
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
