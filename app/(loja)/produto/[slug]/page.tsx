'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Heart, Minus, Plus, Share2, Truck } from 'lucide-react'
import { brl, imgUrl } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import { addAndConfirm, catalog, demo, findProduct, useDemo } from '@/lib/demo/store'
import { toast } from '@/lib/ui'
import { ColorPicker } from '@/components/store/color-picker'
import { ProductCard } from '@/components/store/product'

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const s = useDemo()
  const p = findProduct(s, slug)
  const [qty, setQty] = useState(1)
  const [view, setView] = useState(0)

  if (!p) {
    return <div className="wrap empty page-pad"><h1>Produto não encontrado</h1><Link className="btn" href="/produtos">Ver coleção</Link></div>
  }

  const all = catalog(s)
  const family = all.filter((o) => o.family === p.family)
  const related = all.filter((o) => o.categoryId === p.categoryId && o.family !== p.family).slice(0, 4)
  const more = related.length ? related : family.filter((o) => o.slug !== p.slug).slice(0, 4)
  const stock = s.stock[p.slug] ?? 0
  const out = p.soldOut || stock <= 0
  const fav = s.favorites.includes(p.slug)
  const low = !out && stock <= s.lowStockAt
  const views = [
    { label: 'Foto completa', cls: '' },
    { label: 'Detalhe da lente', cls: 'zoom-a' },
    { label: 'Detalhe da armação', cls: 'zoom-b' },
  ]

  return (
    <div className="wrap pdp">
      <nav className="crumbs" aria-label="Navegação estrutural">
        <Link href="/">Início</Link><span>/</span><Link href={`/produtos?cat=${p.categoryId}`}>{p.family}</Link>
      </nav>
      <div className="pdp-grid">
        <div className="pdp-gallery">
          <div className="pdp-thumbs">
            {views.map((v, i) => (
              <button key={v.label} onClick={() => setView(i)} aria-label={v.label} aria-pressed={view === i} className={view === i ? 'on' : ''}>
                <img src={imgUrl(p.image)} alt="" className={v.cls} />
              </button>
            ))}
          </div>
          <div className="pdp-main">
            <img key={view} src={imgUrl(p.image)} alt={p.name} className={views[view].cls} />
          </div>
        </div>
        <div className="pdp-info">
          <span className="eyebrow">{p.family}</span>
          <h1>{p.variant}</h1>
          <p className="pdp-price">{p.oldPrice && <s>{brl(p.oldPrice)}</s>}<b>{brl(p.price)}</b><span>por peça</span></p>
          <div className="pdp-opts">
            <span className="field-label">Cor da lente</span>
            <ColorPicker options={family} value={p} onChange={(o) => router.push(`/produto/${o.slug}`, { scroll: false })} />
          </div>
          {!out && (
            <div className="pdp-qty">
              <span className="field-label" id="qty-label">Quantidade</span>
              <div className="pdp-qty-row">
                <div className="qty" role="group" aria-labelledby="qty-label">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir"><Minus size={16} /></button>
                  <output>{qty}</output>
                  <button onClick={() => setQty((q) => Math.min(stock, q + 1))} aria-label="Aumentar"><Plus size={16} /></button>
                </div>
                {[6, 12].filter((n) => n <= stock).map((n) => (
                  <button key={n} className={`mini ${qty === n ? 'on' : ''}`} onClick={() => setQty(n)}>{n} peças</button>
                ))}
              </div>
              {low && <p className="warn-text">Últimas {stock} peças na demonstração</p>}
            </div>
          )}
          <div className="pdp-cta">
            <button
              className="btn btn-block" disabled={out}
              onClick={() => addAndConfirm(p.slug, qty)}
            >
              {out ? 'Esgotado' : `Adicionar ao pedido · ${brl(p.price * qty)}`}
            </button>
            <button className={`icon-btn square ${fav ? 'gold' : ''}`} onClick={() => demo.toggleFavorite(p.slug)} aria-pressed={fav} aria-label="Favoritar">
              <Heart size={20} fill={fav ? 'currentColor' : 'none'} />
            </button>
            <button
              className="icon-btn square" aria-label="Copiar link"
              onClick={() => { navigator.clipboard?.writeText(location.href).catch(() => {}); toast('Link copiado') }}
            ><Share2 size={19} /></button>
          </div>
          <ul className="pdp-rules">
            <li><Check size={16} aria-hidden /> Mínimo de {STORE.minPieces} peças por pedido, pode mesclar os modelos</li>
            <li><Truck size={16} aria-hidden /> Frete fixo de {brl(STORE.shipping)} para todo o Brasil</li>
          </ul>
        </div>
      </div>
      {more.length > 0 && (
        <section className="pdp-more">
          <header className="sec-head"><span className="eyebrow">Mesma linha</span><h2>Para <em>mesclar</em> no pedido</h2></header>
          <div className="grid">{more.map((o) => <ProductCard key={o.slug} p={o} />)}</div>
        </section>
      )}
    </div>
  )
}
