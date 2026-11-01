'use client'

import Link from 'next/link'
import { catalog, useDemo } from '@/lib/demo/store'
import { ProductCard } from '@/components/store/product'

export default function Favorites() {
  const s = useDemo()
  const list = catalog(s).filter((p) => s.favorites.includes(p.slug))
  return (
    <div className="wrap list-page">
      <header className="list-head"><span className="eyebrow">{list.length} salvos</span><h1>Favoritos</h1></header>
      {list.length
        ? <div className="grid">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
        : <div className="empty"><p>Toque no coração de um produto para guardar aqui.</p><Link className="btn" href="/produtos">Ver coleção</Link></div>}
    </div>
  )
}
