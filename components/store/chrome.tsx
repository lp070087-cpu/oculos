'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Heart, Instagram, Menu, MessageCircle, Minus, Plus, Search, ShoppingBag, Trash2, User, X } from 'lucide-react'
import { CATEGORIES, brl, imgUrl, normalize } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import { cartSummary, catalog, demo, useDemo } from '@/lib/demo/store'
import { setCartOpen, useUi } from '@/lib/ui'
import { Logo, Wave } from '@/components/ui'
import { Helix } from './helix'

const NAV = [
  { href: '/produtos', label: 'Coleção' },
  { href: '/produtos?promo=1', label: 'Promoções' },
  { href: '/produtos?cat=juliet', label: 'Juliet' },
  { href: '/produtos?cat=flack', label: 'Flack 2.0' },
  { href: '/produtos?cat=ouro', label: 'Banho ouro' },
]

export function Header() {
  const s = useDemo()
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const path = usePathname()
  const pieces = s.cart.reduce((n, c) => n + c.qty, 0)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useEffect(() => { setMenu(false); setSearch(false) }, [path])
  useEffect(() => { document.body.style.overflow = menu ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [menu])

  return (
    <>
      <div className="ticker" aria-label={`Atacado, mínimo de ${STORE.minPieces} peças, pode mesclar modelos, frete fixo de R$ ${STORE.shipping}, enviamos para todo o Brasil`}>
        <div aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}>Atacado <i /> Mínimo {STORE.minPieces} peças <i /> Pode mesclar modelos <i /> Frete fixo R$ {STORE.shipping},00 <i /> Enviamos para todo o Brasil <i /></span>
          ))}
        </div>
      </div>
      <header className={`hdr ${scrolled ? 'hdr-solid' : ''}`}>
        <button className="icon-btn hdr-burger" onClick={() => setMenu(true)} aria-label="Abrir menu" aria-expanded={menu}><Menu size={22} /></button>
        <Logo />
        <nav className="hdr-nav" aria-label="Principal">
          {NAV.map((n) => <Link key={n.href} href={n.href} prefetch={false}>{n.label}</Link>)}
        </nav>
        <div className="hdr-actions">
          <button className="icon-btn" onClick={() => setSearch((v) => !v)} aria-label="Buscar produtos" aria-expanded={search}><Search size={20} /></button>
          <Link className="icon-btn hide-sm" href="/favoritos" aria-label={`Favoritos, ${s.favorites.length} itens`}>
            <Heart size={20} />{s.favorites.length > 0 && <em>{s.favorites.length}</em>}
          </Link>
          <Link className="icon-btn hide-sm" href="/conta" aria-label="Minha conta"><User size={20} /></Link>
          <button className="icon-btn" onClick={() => setCartOpen(true)} aria-label={`Abrir carrinho, ${pieces} peças`}>
            <ShoppingBag size={20} />{pieces > 0 && <em>{pieces}</em>}
          </button>
        </div>
        {search && <SearchPanel onClose={() => setSearch(false)} />}
      </header>
      {menu && (
        <div className="mnav" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mnav-top"><Logo /><button className="icon-btn" onClick={() => setMenu(false)} aria-label="Fechar menu"><X size={24} /></button></div>
          <nav>
            {NAV.map((n, i) => <Link key={n.href} href={n.href} onClick={() => setMenu(false)} style={{ animationDelay: `${i * 45}ms` }}>{n.label}</Link>)}
            <Link href="/favoritos" onClick={() => setMenu(false)}>Favoritos</Link>
            <Link href="/conta" onClick={() => setMenu(false)}>Minha conta</Link>
          </nav>
          <Wave seed={3} />
          <p className="mnav-foot">{STORE.phoneDisplay} · {STORE.instagramHandle}</p>
        </div>
      )}
    </>
  )
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const s = useDemo()
  const [q, setQ] = useState('')
  const router = useRouter()
  const hits = useMemo(() => {
    const n = normalize(q.trim())
    return n ? catalog(s).filter((p) => normalize(p.name).includes(n)).slice(0, 5) : []
  }, [q, s])
  return (
    <form className="srch" role="search" onSubmit={(e) => { e.preventDefault(); router.push(`/produtos?q=${encodeURIComponent(q)}`); onClose() }}>
      <div className="srch-box">
        <Search size={20} aria-hidden />
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar modelo, lente, cor" aria-label="Buscar produtos" onKeyDown={(e) => { if (e.key === 'Escape') onClose() }} />
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar busca"><X size={18} /></button>
      </div>
      {q.trim() && (
        <ul>
          {hits.map((p) => (
            <li key={p.slug}><Link href={`/produto/${p.slug}`} onClick={onClose}><img src={imgUrl(p.image)} alt="" /><span>{p.name}</span><b>{brl(p.price)}</b></Link></li>
          ))}
          {hits.length === 0 && <li className="srch-none">Nada encontrado para “{q}”.</li>}
        </ul>
      )}
    </form>
  )
}

export function CartDrawer() {
  const s = useDemo()
  const { cartOpen } = useUi()
  const sum = cartSummary(s)
  const pct = Math.min(100, (sum.pieces / STORE.minPieces) * 100)

  useEffect(() => {
    if (!cartOpen) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setCartOpen(false) }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [cartOpen])

  return (
    <div className={`drawer-wrap ${cartOpen ? 'open' : ''}`} aria-hidden={!cartOpen}>
      <button className="drawer-back" tabIndex={cartOpen ? 0 : -1} onClick={() => setCartOpen(false)} aria-label="Fechar carrinho" />
      <aside className="drawer" role="dialog" aria-label="Carrinho" {...(cartOpen ? {} : { inert: true })}>
        <header><h2>Seu pedido</h2><button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="Fechar carrinho"><X size={22} /></button></header>
        <div className="minbar">
          <div className="minbar-txt">
            <span>{sum.pieces} de {STORE.minPieces} peças</span>
            <b>{sum.missing > 0 ? `Faltam ${sum.missing}` : 'Mínimo atingido'}</b>
          </div>
          <div className="minbar-track"><i style={{ width: `${pct}%` }} /></div>
        </div>
        {sum.lines.length === 0 ? (
          <div className="drawer-empty">
            <p>Seu pedido está vazio.</p>
            <Link className="btn" href="/produtos" onClick={() => setCartOpen(false)}>Ver coleção</Link>
          </div>
        ) : (
          <ul className="cart-list">
            {sum.lines.map((l) => (
              <li key={l.slug}>
                <img src={imgUrl(l.product.image)} alt="" />
                <div>
                  <Link href={`/produto/${l.slug}`} onClick={() => setCartOpen(false)}>{l.product.name}</Link>
                  <span>{brl(l.product.price)} cada</span>
                  <div className="qty qty-sm">
                    <button onClick={() => demo.setQty(l.slug, l.qty - 1)} aria-label={`Diminuir ${l.product.name}`}><Minus size={14} /></button>
                    <output>{l.qty}</output>
                    <button onClick={() => demo.setQty(l.slug, l.qty + 1)} aria-label={`Aumentar ${l.product.name}`}><Plus size={14} /></button>
                  </div>
                </div>
                <div className="cart-right">
                  <b>{brl(l.qty * l.product.price)}</b>
                  <button className="icon-btn" onClick={() => demo.setQty(l.slug, 0)} aria-label={`Remover ${l.product.name}`}><Trash2 size={16} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {sum.lines.length > 0 && (
          <footer>
            <div className="row-between"><span>Subtotal</span><b>{brl(sum.subtotal)}</b></div>
            <div className="row-between muted"><span>Frete fixo</span><span>{brl(STORE.shipping)}</span></div>
            {sum.missing > 0 ? (
              <Link className="btn btn-block btn-ghost" href="/produtos" onClick={() => setCartOpen(false)}>Adicionar mais {sum.missing} {sum.missing === 1 ? 'peça' : 'peças'}</Link>
            ) : (
              <Link className="btn btn-block" href="/checkout" onClick={() => setCartOpen(false)}>Finalizar pedido de teste</Link>
            )}
          </footer>
        )}
      </aside>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="ftr">
      <Helix className="helix-foot" />
      <div className="ftr-grid">
        <div>
          <p className="ftr-big">Sou seu fornecedor<br /><em>e te ajudo a vender mais.</em></p>
          <p className="muted">{STORE.years} anos de mercado · {STORE.city}</p>
        </div>
        <div>
          <h3>Comprar</h3>
          {CATEGORIES.slice(0, 5).map((c) => <Link key={c.id} href={`/produtos?cat=${c.id}`} prefetch={false}>{c.label}</Link>)}
          <Link href="/produtos?promo=1">Promoções</Link>
        </div>
        <div>
          <h3>Atendimento</h3>
          <Link href="/conta/atendimento">Falar com a loja</Link>
          <a href={`https://wa.me/${STORE.phoneE164}`} target="_blank" rel="noreferrer"><MessageCircle size={15} aria-hidden /> {STORE.phoneDisplay}</a>
          <a href={STORE.instagram} target="_blank" rel="noreferrer"><Instagram size={15} aria-hidden /> {STORE.instagramHandle}</a>
          <a href={STORE.catalogUrl} target="_blank" rel="noreferrer">Catálogo atual</a>
        </div>
        <div>
          <h3>Como funciona</h3>
          <p>Mínimo de {STORE.minPieces} peças</p>
          <p>Pode mesclar os modelos</p>
          <p>Frete fixo {`R$ ${STORE.shipping},00`}</p>
          <p>Enviamos para todo o Brasil</p>
        </div>
      </div>
      <div className="ftr-legal">
        <span>{STORE.name} · {STORE.owner} · {STORE.city}</span>
        <span>Demonstração comercial. Nenhum pagamento real é processado.</span>
      </div>
    </footer>
  )
}

export function FloatingWhatsApp() {
  return (
    <Link href="/conta/atendimento" className="wa-float" aria-label="Falar com a loja">
      <MessageCircle size={22} aria-hidden />
    </Link>
  )
}
