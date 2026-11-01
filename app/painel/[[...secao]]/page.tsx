'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { BarChart3, Boxes, LayoutDashboard, Megaphone, MessageCircle, Package, Settings, Store, Truck, Users } from 'lucide-react'
import { brl } from '@/lib/catalog'
import { demo, useDemo, useHydrated } from '@/lib/demo/store'
import { toast } from '@/lib/ui'
import { Logo } from '@/components/ui'
import { Overview, Finance } from '@/components/painel/overview'
import { Orders } from '@/components/painel/orders'
import { Products } from '@/components/painel/products'
import { Customers } from '@/components/painel/customers'
import { Marketing } from '@/components/painel/marketing'
import { WhatsApp } from '@/components/painel/whatsapp'
import { ShippingSettings } from '@/components/painel/shipping'

const NAV = [
  { id: '', label: 'Visão geral', Icon: LayoutDashboard },
  { id: 'pedidos', label: 'Pedidos', Icon: Package },
  { id: 'produtos', label: 'Produtos e estoque', Icon: Boxes },
  { id: 'clientes', label: 'Clientes', Icon: Users },
  { id: 'financeiro', label: 'Financeiro', Icon: BarChart3 },
  { id: 'marketing', label: 'Marketing', Icon: Megaphone },
  { id: 'whatsapp', label: 'Central WhatsApp', Icon: MessageCircle },
  { id: 'configuracoes/entregas/melhor-envio', label: 'Entregas', Icon: Truck },
  { id: 'ajustes', label: 'Ajustes da demo', Icon: Settings },
]

export default function Panel() {
  const { secao } = useParams<{ secao?: string[] }>()
  const s = useDemo()
  const ready = useHydrated()
  const section = secao?.join('/') ?? ''
  const newOrders = s.orders.filter((o) => o.status === 'novo').length
  const unread = s.conversations.reduce((n, c) => n + c.unread, 0)

  // Avisa sobre pedidos que chegam de outra aba enquanto o painel está aberto.
  const known = useRef<string | null>(null)
  useEffect(() => {
    if (!ready) return
    const top = s.orders[0]
    if (known.current && top && top.id !== known.current) toast(`Novo pedido ${top.id}: ${top.customerName}, ${brl(top.total)}`, { href: '/painel/pedidos', action: 'Ver' })
    known.current = top?.id ?? null
  }, [ready, s.orders])

  if (!ready) return <div className="app-main" />

  return (
    <div className="app">
      <aside className="side">
        <Logo size={34} />
        <nav aria-label="Painel">
          {NAV.map(({ id, label, Icon }) => (
            <Link key={id} href={`/painel${id ? `/${id}` : ''}`} aria-current={section === id ? 'page' : undefined}>
              <Icon size={17} aria-hidden /> {label}
              {id === 'pedidos' && newOrders > 0 && <em>{newOrders}</em>}
              {id === 'whatsapp' && unread > 0 && <em>{unread}</em>}
            </Link>
          ))}
          <Link href="/"><Store size={17} aria-hidden /> Ver a loja</Link>
        </nav>
        <div className="side-foot">Painel de demonstração. Dados fictícios.</div>
      </aside>
      <nav className="tabbar" aria-label="Painel">
        {NAV.map(({ id, label }) => <Link key={id} href={`/painel${id ? `/${id}` : ''}`} aria-current={section === id ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <main className="app-main">
        {section === '' && <Overview s={s} />}
        {section === 'pedidos' && <Orders s={s} />}
        {section === 'produtos' && <Products s={s} />}
        {section === 'clientes' && <Customers s={s} />}
        {section === 'financeiro' && <Finance s={s} />}
        {section === 'marketing' && <Marketing s={s} />}
        {section === 'whatsapp' && <WhatsApp s={s} />}
        {section === 'configuracoes/entregas/melhor-envio' && <ShippingSettings s={s} />}
        {section === 'ajustes' && (
          <>
            <header className="app-top"><div><h1>Ajustes da demo</h1><p>Volte ao estado inicial antes de cada apresentação</p></div></header>
            <section className="panel" style={{ maxWidth: 560 }}>
              <h2>Restaurar dados</h2>
              <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>Apaga pedidos de teste, conversas e carrinho deste navegador e recarrega os dados fictícios.</p>
              <button className="btn btn-ghost" onClick={() => { demo.reset(); toast('Demonstração restaurada') }}>Restaurar demonstração</button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
