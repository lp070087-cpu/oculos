'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, ArrowUpRight, Instagram, MessageCircle } from 'lucide-react'
import { CATEGORIES, imgUrl } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import { catalog, useDemo } from '@/lib/demo/store'
import { Hero } from '@/components/store/hero'
import { ProductCard } from '@/components/store/product'
import { Helix } from '@/components/store/helix'
import { Reveal } from '@/components/ui'

export default function Home() {
  const s = useDemo()
  const all = catalog(s)
  const launches = all.filter((p) => p.limited)
  const featured = all.filter((p) => p.featured && !p.limited)
  const promos = all.filter((p) => p.oldPrice && !p.soldOut)
  const [hover, setHover] = useState(0)

  return (
    <>
      <h1 className="sr-only">Oliveira OKL, atacado de lupas e acessórios</h1>
      <Hero />

      <section className="specs" aria-label="Como funciona o atacado">
        <div><b>{STORE.minPieces}</b><span>peças de pedido mínimo</span></div>
        <div><b>Mix</b><span>pode mesclar os modelos</span></div>
        <div><b>R$ {STORE.shipping}</b><span>frete fixo</span></div>
        <div><b>BR</b><span>enviamos para todo o Brasil</span></div>
      </section>

      <Reveal as="section" className="wrap tracks">
        <div className="tracks-list">
          <header className="sec-head">
            <span className="eyebrow">Índice de modelos</span>
            <h2>Escolha a <em>sua linha</em></h2>
          </header>
          <ol>
            {CATEGORIES.map((c, i) => (
              <li key={c.id} onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)}>
                <Link href={`/produtos?cat=${c.id}`} prefetch={false} className={hover === i ? 'on' : ''}>
                  <span className="tr-n">{String(i + 1).padStart(2, '0')}</span>
                  <span className="tr-name">{c.label}</span>
                  <span className="tr-note">{c.note}</span>
                  <ArrowUpRight size={20} aria-hidden />
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="tracks-view" aria-hidden="true">
          {CATEGORIES.map((c, i) => <img key={c.id} src={imgUrl(c.image)} alt="" className={hover === i ? 'on' : ''} loading="lazy" />)}
        </div>
      </Reveal>

      <Reveal as="section" className="wrap launch">
        <header className="sec-head sec-row">
          <div>
            <span className="eyebrow">Lançamentos</span>
            <h2>Juliet <em>edição limitada</em></h2>
          </div>
          <Link className="link-arrow" href="/produtos?lancamentos=1">Ver todos <ArrowRight size={16} aria-hidden /></Link>
        </header>
        <div className="launch-grid">
          {launches.map((p, i) => <ProductCard key={p.slug} p={p} large={i === 0} />)}
        </div>
      </Reveal>

      <Helix className="helix-sep" />

      <Reveal as="section" className="wrap">
        <header className="sec-head sec-row">
          <div>
            <span className="eyebrow">Em destaque</span>
            <h2>Os que <em>giram rápido</em> na vitrine</h2>
          </div>
          <Link className="link-arrow" href="/produtos">Coleção completa <ArrowRight size={16} aria-hidden /></Link>
        </header>
        <div className="grid">{featured.map((p) => <ProductCard key={p.slug} p={p} />)}</div>
      </Reveal>

      <section className="promo">
        <div className="wrap">
          <header className="sec-head sec-row">
            <div>
              <span className="eyebrow">Vitrine promocional</span>
              <h2>Preço de <em>queima</em></h2>
            </div>
            <Link className="link-arrow" href="/produtos?promo=1">Todas as promoções <ArrowRight size={16} aria-hidden /></Link>
          </header>
        </div>
        <div className="promo-rail" tabIndex={0} role="region" aria-label="Produtos em promoção">
          {promos.slice(0, 12).map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </section>

      <Reveal as="section" className="wrap about">
        <div className="about-photo"><img src="/5ed10c05f3b3b2bdacb46d6f622bcf44.webp" alt="" /></div>
        <div>
          <span className="eyebrow">Fornecedor direto</span>
          <blockquote>“{STORE.bio}.”</blockquote>
          <p className="about-sub">{STORE.owner} · {STORE.years} anos de mercado · {STORE.city}</p>
          <div className="about-cta">
            <a className="btn btn-ghost" href={STORE.instagram} target="_blank" rel="noreferrer"><Instagram size={17} aria-hidden /> {STORE.instagramHandle}</a>
            <Link className="btn btn-ghost" href="/conta/atendimento"><MessageCircle size={17} aria-hidden /> Falar com a loja</Link>
          </div>
        </div>
      </Reveal>
    </>
  )
}
