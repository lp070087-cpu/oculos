'use client'

import Link from 'next/link'
import { Heart, Plus } from 'lucide-react'
import { brl, imgUrl, type Product } from '@/lib/catalog'
import { demo, useDemo } from '@/lib/demo/store'
import { setCartOpen } from '@/lib/ui'

export function ProductCard({ p, large, priority }: { p: Product; large?: boolean; priority?: boolean }) {
  const fav = useDemo((s) => s.favorites.includes(p.slug))
  const stock = useDemo((s) => s.stock[p.slug] ?? 0)
  const out = p.soldOut || stock <= 0
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0
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
        <div className="card-foot">
          <p>{p.oldPrice && <s>{brl(p.oldPrice)}</s>}<b>{brl(p.price)}</b></p>
          {!out && (
            <button
              className="card-add"
              aria-label={`Adicionar ${p.name} ao pedido`}
              onClick={() => { demo.addToCart(p.slug, 1); setCartOpen(true) }}
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
