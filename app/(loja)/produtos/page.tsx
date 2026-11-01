'use client'

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { CATEGORIES, STORE_INDEX, imgUrl, normalize } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import { catalog, useDemo } from '@/lib/demo/store'
import { ProductCard } from '@/components/store/product'

const SORTS: Record<string, string> = { relevancia: 'Relevância', menor: 'Menor preço', maior: 'Maior preço', nome: 'Nome' }

function Listing() {
  const sp = useSearchParams()
  const s = useDemo()
  const cat = sp.get('cat')
  const promo = sp.get('promo') === '1'
  const launches = sp.get('lancamentos') === '1'
  const q = sp.get('q') ?? ''
  const [sort, setSort] = useState('relevancia')
  const [stockOnly, setStockOnly] = useState(false)

  const list = useMemo(() => {
    let r = catalog(s)
    if (cat) r = r.filter((p) => p.categoryId === cat)
    if (promo) r = r.filter((p) => p.oldPrice)
    if (launches) r = r.filter((p) => p.limited)
    if (q) r = r.filter((p) => normalize(p.name).includes(normalize(q)))
    if (stockOnly) r = r.filter((p) => !p.soldOut && (s.stock[p.slug] ?? 0) > 0)
    if (sort === 'menor') r = [...r].sort((a, b) => a.price - b.price)
    if (sort === 'maior') r = [...r].sort((a, b) => b.price - a.price)
    if (sort === 'nome') r = [...r].sort((a, b) => a.name.localeCompare(b.name))
    return r
  }, [s, cat, promo, launches, q, sort, stockOnly])

  const category = CATEGORIES.find((c) => c.id === cat)
  const title = q ? `“${q}”` : category?.label ?? (promo ? 'Promoções' : launches ? 'Lançamentos' : 'Coleção')

  return (
    <div className="wrap list-page">
      <header className="list-head">
        <span className="eyebrow">{list.length} {list.length === 1 ? 'produto' : 'produtos'}</span>
        <h1>{title}</h1>
      </header>
      <div className="chips" role="navigation" aria-label="Linhas">
        <Link href="/produtos" className={!cat && !promo && !launches ? 'on' : ''}>Todos</Link>
        <Link href="/produtos?promo=1" className={promo ? 'on' : ''}>Promoções</Link>
        {CATEGORIES.map((c) => <Link key={c.id} href={`/produtos?cat=${c.id}`} className={cat === c.id ? 'on' : ''}>{c.label}</Link>)}
      </div>
      <div className="list-tools">
        <label className="check"><input type="checkbox" checked={stockOnly} onChange={(e) => setStockOnly(e.target.checked)} /> Somente disponíveis</label>
        <label className="sel">Ordenar
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      {list.length ? (
        <div className="grid">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      ) : (
        <div className="empty"><p>Nenhum produto encontrado.</p><Link className="btn" href="/produtos">Ver coleção completa</Link></div>
      )}

      <section className="index">
        <header className="sec-head sec-row">
          <div><span className="eyebrow">Catálogo atual</span><h2>Todas as <em>{STORE_INDEX.length} linhas</em> da loja</h2></div>
          <a className="link-arrow" href={STORE.catalogUrl} target="_blank" rel="noreferrer">Abrir catálogo <ExternalLink size={15} aria-hidden /></a>
        </header>
        <p className="muted index-note">Nesta demonstração estão importadas as linhas com foto disponível. As demais abrem no catálogo atual da loja.</p>
        <ul>
          {STORE_INDEX.map((c) => (
            <li key={c.label}><a href={STORE.catalogUrl} target="_blank" rel="noreferrer"><img src={imgUrl(c.image)} alt="" loading="lazy" /><span>{c.label}</span></a></li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={<div className="wrap list-page" />}><Listing /></Suspense>
}
