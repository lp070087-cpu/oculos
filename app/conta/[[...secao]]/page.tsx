'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Bell, Heart, Home, LogOut, MapPin, MessageCircle, Package, ShoppingBag, Ticket, UserRound } from 'lucide-react'
import { brl, imgUrl } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import { catalog, demo, findProduct, me, useDemo, useHydrated } from '@/lib/demo/store'
import { fmtDate, fmtDateTime, fmtTime, toast } from '@/lib/ui'
import { Logo, ORDER_LABEL, PAY_LABEL, Pill, orderTone, payTone } from '@/components/ui'
import { ProductCard } from '@/components/store/product'
import { MobileNav } from '@/components/mobile-nav'
import type { Customer, DemoState, Order } from '@/lib/demo/types'

const NAV = [
  { id: '', label: 'Início', Icon: Home },
  { id: 'pedidos', label: 'Pedidos', Icon: Package },
  { id: 'favoritos', label: 'Favoritos', Icon: Heart },
  { id: 'carrinho', label: 'Carrinho salvo', Icon: ShoppingBag },
  { id: 'cupons', label: 'Cupons', Icon: Ticket },
  { id: 'atendimento', label: 'Atendimento', Icon: MessageCircle },
  { id: 'notificacoes', label: 'Notificações', Icon: Bell },
  { id: 'enderecos', label: 'Endereços', Icon: MapPin },
  { id: 'perfil', label: 'Perfil', Icon: UserRound },
]

export default function Account() {
  const { secao } = useParams<{ secao?: string[] }>()
  const s = useDemo()
  const ready = useHydrated()
  const user = me(s)
  const router = useRouter()
  const section = secao?.[0] ?? ''
  const unread = s.notices.filter((n) => !n.read).length

  if (!ready) return <div className="app-main" />
  if (!user) return <Auth />

  return (
    <div className="app">
      <aside className="side">
        <Logo size={34} />
        <nav aria-label="Minha conta">
          {NAV.map(({ id, label, Icon }) => (
            <Link key={id} href={`/conta${id ? `/${id}` : ''}`} aria-current={section === id ? 'page' : undefined}>
              <Icon size={17} aria-hidden /> {label}
              {id === 'notificacoes' && unread > 0 && <em>{unread}</em>}
            </Link>
          ))}
          <Link href="/"><ShoppingBag size={17} aria-hidden /> Voltar à loja</Link>
        </nav>
        <div className="side-foot">
          <p>{user.name}</p>
          <button className="text-btn" onClick={() => { demo.logout(); router.push('/conta') }}><LogOut size={13} style={{ display: 'inline', marginRight: 5 }} aria-hidden />Sair</button>
        </div>
      </aside>
      <MobileNav
        label="Minha conta"
        items={[
          ...NAV.map(({ id, label, Icon }) => ({ href: `/conta${id ? `/${id}` : ''}`, label: id ? label : 'Minha conta', Icon, current: section === id, badge: id === 'notificacoes' ? unread : 0 })),
          { href: '/', label: 'Voltar à loja', Icon: ShoppingBag },
        ]}
        footer={(close) => (
          <>
            <p>{user.name}</p>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => { close(); demo.logout(); router.push('/conta') }}><LogOut size={16} aria-hidden /> Sair</button>
          </>
        )}
      />
      <main className="app-main">
        {section === '' && <Dashboard s={s} user={user} />}
        {section === 'pedidos' && (secao?.[1] ? <OrderDetail s={s} id={secao[1]} /> : <Orders s={s} user={user} />)}
        {section === 'favoritos' && <Favs s={s} />}
        {section === 'carrinho' && <Saved s={s} />}
        {section === 'cupons' && <Coupons s={s} />}
        {section === 'atendimento' && <Support s={s} user={user} />}
        {section === 'notificacoes' && <Notices s={s} />}
        {section === 'enderecos' && <Addresses user={user} />}
        {section === 'perfil' && <Profile user={user} />}
      </main>
    </div>
  )
}

function Top({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return <header className="app-top"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{children && <div className="app-actions">{children}</div>}</header>
}

function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('demo-01@exemplo.test')
  const [f, setF] = useState({ name: '', business: '', phone: '', city: '', marketing: false })
  const up = (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'in') { const c = demo.login(email); toast(`Olá, ${c.name.split(' ')[0]}`); return }
    if (!f.name.trim() || !email.trim()) { toast('Informe nome e e-mail'); return }
    demo.register({ name: f.name, business: f.business, email, phone: f.phone, city: f.city, marketingConsent: f.marketing })
  }
  return (
    <div className="auth">
      <figure className="auth-art">
        <img src="/banners/your-frequency-mobile.webp" alt="" />
        <figcaption><span className="eyebrow">Atacado a partir de {STORE.minPieces} peças</span>Your Style. Your Frequency.</figcaption>
      </figure>
      <form className="auth-form" onSubmit={up}>
        <Logo />
        <h1>{mode === 'in' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="muted">Acesso demonstrativo. Não use senha real: nenhuma é solicitada.</p>
        {mode === 'up' && (
          <>
            <label className="field"><span>Nome</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="field"><span>Loja (opcional)</span><input value={f.business} onChange={(e) => setF({ ...f, business: e.target.value })} /></label>
            <label className="field"><span>WhatsApp</span><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            <label className="field"><span>Cidade - UF</span><input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
          </>
        )}
        <label className="field"><span>E-mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        {mode === 'up' && <label className="check"><input type="checkbox" checked={f.marketing} onChange={(e) => setF({ ...f, marketing: e.target.checked })} /> Aceito receber promoções pelo WhatsApp</label>}
        <button className="btn btn-block">{mode === 'in' ? 'Entrar na demonstração' : 'Criar conta de teste'}</button>
        <button type="button" className="text-btn" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Ainda não tenho conta' : 'Já tenho conta'}</button>
        <Link className="muted" href="/" style={{ fontSize: 14 }}>Voltar à loja</Link>
      </form>
    </div>
  )
}

const mine = (s: DemoState, user: Customer) => s.orders.filter((o) => o.customerId === user.id)

function OrderRows({ orders }: { orders: Order[] }) {
  if (!orders.length) return <div className="empty"><p>Nenhum pedido ainda.</p><Link className="btn" href="/produtos">Ver coleção</Link></div>
  return (
    <ul className="list-rows">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/conta/pedidos/${o.id}`}><b>{o.id}</b><small>{fmtDate(o.createdAt)} · {o.items.reduce((n, i) => n + i.qty, 0)} peças</small></Link>
          <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Pill tone={orderTone(o.status)}>{ORDER_LABEL[o.status]}</Pill><b>{brl(o.total)}</b></span>
        </li>
      ))}
    </ul>
  )
}

function Dashboard({ s, user }: { s: DemoState; user: Customer }) {
  const orders = mine(s, user)
  const open = orders.filter((o) => ['novo', 'separacao', 'enviado'].includes(o.status))
  const spent = orders.filter((o) => o.status !== 'cancelado').reduce((n, o) => n + o.total, 0)
  return (
    <>
      <Top title={`Olá, ${user.name.split(' ')[0]}`} sub={user.business || 'Sua conta de teste'} />
      <div className="kpis">
        <div className="kpi"><span>Pedidos em aberto</span><b>{open.length}</b></div>
        <div className="kpi"><span>Total em compras</span><b>{brl(spent)}</b></div>
        <div className="kpi"><span>Favoritos</span><b>{s.favorites.length}</b></div>
        <div className="kpi"><span>Cupons ativos</span><b>{s.coupons.filter((c) => c.active).length}</b></div>
      </div>
      <div className="cols">
        <section className="panel"><div className="panel-h">Últimos pedidos <Link className="text-btn" href="/conta/pedidos">Ver todos</Link></div><OrderRows orders={orders.slice(0, 4)} /></section>
        <section className="panel">
          <div className="panel-h">Notificações <Link className="text-btn" href="/conta/notificacoes">Ver todas</Link></div>
          <ul className="list-rows">{s.notices.slice(0, 3).map((n) => <li key={n.id}><span>{n.title}<small>{fmtDate(n.at)}</small></span></li>)}</ul>
        </section>
      </div>
    </>
  )
}

function Orders({ s, user }: { s: DemoState; user: Customer }) {
  return <><Top title="Pedidos" sub="Histórico de compras de teste" /><section className="panel"><OrderRows orders={mine(s, user)} /></section></>
}

const FLOW: Order['status'][] = ['novo', 'separacao', 'enviado', 'entregue']

function OrderDetail({ s, id }: { s: DemoState; id: string }) {
  const o = s.orders.find((x) => x.id === id)
  if (!o) return <div className="empty"><p>Pedido não encontrado.</p><Link className="btn" href="/conta/pedidos">Meus pedidos</Link></div>
  const at = FLOW.indexOf(o.status)
  return (
    <>
      <Top title={o.id} sub={fmtDateTime(o.createdAt)}><Link className="btn btn-ghost btn-sm" href="/conta/pedidos">Voltar</Link></Top>
      <section className="panel">
        <div className="panel-h">Status da entrega <Pill tone={orderTone(o.status)}>{ORDER_LABEL[o.status]}</Pill></div>
        <div className="steps">{FLOW.map((f, i) => <div key={f} className={i <= at ? 'on' : ''}>{ORDER_LABEL[f]}</div>)}</div>
        {o.shippingOption && <p className="muted" style={{ fontSize: 14 }}>{o.shippingOption.service} · {o.shippingOption.deadline}{o.shippingOption.source === 'demo' ? ' · DEMO' : ''}</p>}
        {o.tracking && <p className="muted" style={{ fontSize: 14 }}>Rastreio de demonstração: {o.tracking}</p>}
      </section>
      <div className="cols" style={{ marginTop: 20 }}>
        <section className="panel">
          <h2>Itens</h2>
          <ul className="list-rows">
            {o.items.map((i) => <li key={i.slug}><span className="prod-cell"><img src={i.image} alt="" /><span>{i.name}<small>{i.qty} × {brl(i.price)}</small></span></span><b>{brl(i.qty * i.price)}</b></li>)}
          </ul>
          <div className="row-between" style={{ marginTop: 10 }}><span className="muted">Frete</span><span>{brl(o.shipping)}</span></div>
          {o.discount > 0 && <div className="row-between"><span className="muted">Desconto</span><span>-{brl(o.discount)}</span></div>}
          <div className="row-between co-total" style={{ marginTop: 8 }}><span>Total</span><b>{brl(o.total)}</b></div>
        </section>
        <section className="panel">
          <h2>Pagamento</h2>
          <Pill tone={payTone(o.paymentStatus)}>{PAY_LABEL[o.paymentStatus]}</Pill>
          <h2 style={{ marginTop: 18 }}>Histórico</h2>
          <ul className="timeline">{o.history.map((h, i) => <li key={i}>{h.text}<small>{fmtDateTime(h.at)}</small></li>)}</ul>
        </section>
      </div>
    </>
  )
}

function Favs({ s }: { s: DemoState }) {
  const list = catalog(s).filter((p) => s.favorites.includes(p.slug))
  return (
    <>
      <Top title="Favoritos" />
      {list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div> : <div className="empty"><p>Nenhum favorito ainda.</p><Link className="btn" href="/produtos">Ver coleção</Link></div>}
    </>
  )
}

function Saved({ s }: { s: DemoState }) {
  const lines = s.savedCart.flatMap((l) => { const p = findProduct(s, l.slug); return p ? [{ ...l, p }] : [] })
  return (
    <>
      <Top title="Carrinho salvo" sub="Retome um pedido de onde parou">
        {s.cart.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => { demo.saveCart(); toast('Carrinho atual salvo') }}>Salvar carrinho atual</button>}
      </Top>
      <section className="panel">
        {lines.length === 0 ? <div className="empty"><p>Nenhum carrinho salvo.</p></div> : (
          <>
            <ul className="list-rows">{lines.map((l) => <li key={l.slug}><span className="prod-cell"><img src={imgUrl(l.p.image)} alt="" /><span>{l.p.name}<small>{l.qty} peças</small></span></span><b>{brl(l.qty * l.p.price)}</b></li>)}</ul>
            <button className="btn" style={{ marginTop: 14 }} onClick={() => { demo.restoreCart(); toast('Itens enviados ao carrinho', { href: '/produtos', action: 'Continuar' }) }}>Retomar pedido</button>
          </>
        )}
      </section>
    </>
  )
}

function Coupons({ s }: { s: DemoState }) {
  return (
    <>
      <Top title="Cupons" sub="Cupons fictícios para testar o checkout" />
      <div className="cols cols-even">
        {s.coupons.filter((c) => c.active).map((c) => (
          <section key={c.code} className="panel">
            <span className="eyebrow">{c.kind === 'percent' ? `${c.value}% de desconto` : `${brl(c.value)} de desconto`}</span>
            <h2 style={{ fontSize: 28, marginTop: 8, marginBottom: 6 }}>{c.code}</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>{c.note}</p>
            <button className="btn btn-ghost btn-sm" onClick={() => { demo.applyCoupon(c.code); toast(`${c.code} aplicado ao carrinho`) }}>Usar no pedido</button>
          </section>
        ))}
      </div>
    </>
  )
}

function Support({ s, user }: { s: DemoState; user: Customer }) {
  const conv = s.conversations.find((c) => c.customerId === user.id)
  const [text, setText] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [conv?.messages.length])
  const send = (t: string) => { if (!t.trim()) return; demo.customerMessage(t.trim()); setText('') }
  const quick = ['Meu pedido já foi separado?', 'Qual o mínimo para comprar?', 'Tem Juliet tio2 verde?']
  return (
    <>
      <Top title="Atendimento" sub="Mensagem simulada: chega na central da loja, nada sai pelo WhatsApp real" />
      <section className="panel" style={{ padding: 0 }}>
        <div className="chat-main" style={{ height: 'min(62svh, 560px)' }}>
          <div className="chat-msgs">
            {!conv?.messages.length && <p className="muted" style={{ textAlign: 'center', fontSize: 14 }}>Envie uma mensagem para a loja.</p>}
            {conv?.messages.map((m) => (
              <div key={m.id} className={`msg ${m.from === 'cliente' ? 'msg-me' : m.from === 'sistema' ? 'msg-sys' : ''}`}>{m.text}<small>{m.from === 'cliente' ? 'Você' : m.from === 'sistema' ? 'Sistema' : STORE.name} · {fmtTime(m.at)}</small></div>
            ))}
            <div ref={end} />
          </div>
          <div className="chips" style={{ margin: 0, padding: '8px 12px 0' }}>{quick.map((q) => <button key={q} onClick={() => send(q)}>{q}</button>)}</div>
          <form className="composer" onSubmit={(e) => { e.preventDefault(); send(text) }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escreva sua mensagem" aria-label="Mensagem" />
            <button className="btn">Enviar</button>
          </form>
        </div>
      </section>
    </>
  )
}

function Notices({ s }: { s: DemoState }) {
  return (
    <>
      <Top title="Notificações"><button className="btn btn-ghost btn-sm" onClick={() => demo.markNoticesRead()}>Marcar como lidas</button></Top>
      <section className="panel">
        <ul className="list-rows">
          {s.notices.map((n) => (
            <li key={n.id}>
              <Link href={n.href ?? '/conta'}>{n.read ? n.title : <b>{n.title}</b>}<small>{n.body} · {fmtDate(n.at)}</small></Link>
              {!n.read && <Pill tone="gold">Nova</Pill>}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Addresses({ user }: { user: Customer }) {
  const [f, setF] = useState({ label: '', line: '', city: '', zip: '' })
  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f.line.trim()) { toast('Informe o endereço'); return }
    demo.updateCustomer(user.id, { addresses: [...user.addresses, { ...f, id: `end-${Date.now()}`, label: f.label || 'Endereço' }] })
    setF({ label: '', line: '', city: '', zip: '' })
    toast('Endereço adicionado')
  }
  return (
    <>
      <Top title="Endereços" />
      <div className="cols cols-even">
        <section className="panel">
          <h2>Salvos</h2>
          {user.addresses.length === 0 && <p className="muted">Nenhum endereço salvo.</p>}
          <ul className="list-rows">
            {user.addresses.map((a) => (
              <li key={a.id}>
                <span>{a.label}<small>{a.line} · {a.city} · {a.zip}</small></span>
                <button className="text-btn" onClick={() => demo.updateCustomer(user.id, { addresses: user.addresses.filter((x) => x.id !== a.id) })}>Remover</button>
              </li>
            ))}
          </ul>
        </section>
        <form className="panel stack" onSubmit={add}>
          <h2 style={{ marginBottom: 0 }}>Novo endereço</h2>
          <label className="field"><span>Identificação</span><input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></label>
          <label className="field"><span>Endereço</span><input value={f.line} onChange={(e) => setF({ ...f, line: e.target.value })} /></label>
          <label className="field"><span>Cidade - UF</span><input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></label>
          <label className="field"><span>CEP</span><input value={f.zip} onChange={(e) => setF({ ...f, zip: e.target.value })} /></label>
          <button className="btn">Salvar endereço</button>
        </form>
      </div>
    </>
  )
}

function Profile({ user }: { user: Customer }) {
  const [f, setF] = useState(user)
  const bind = (k: 'name' | 'business' | 'email' | 'phone' | 'city') => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }) })
  return (
    <>
      <Top title="Perfil" />
      <form className="panel stack" style={{ maxWidth: 640 }} onSubmit={(e) => { e.preventDefault(); demo.updateCustomer(user.id, f); toast('Perfil atualizado') }}>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <label className="field"><span>Nome</span><input {...bind('name')} /></label>
          <label className="field"><span>Loja</span><input {...bind('business')} /></label>
          <label className="field"><span>E-mail</span><input {...bind('email')} /></label>
          <label className="field"><span>WhatsApp</span><input {...bind('phone')} /></label>
          <label className="field"><span>Cidade - UF</span><input {...bind('city')} /></label>
        </div>
        <label className="check"><input type="checkbox" checked={f.marketingConsent} onChange={(e) => setF({ ...f, marketingConsent: e.target.checked })} /> Aceito receber promoções pelo WhatsApp</label>
        <div><button className="btn">Salvar</button></div>
      </form>
    </>
  )
}
