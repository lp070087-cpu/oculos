'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { brl } from '@/lib/catalog'
import { useDemo, useHydrated } from '@/lib/demo/store'
import { Wave } from '@/components/ui'

export default function OrderDone() {
  const { id } = useParams<{ id: string }>()
  const s = useDemo()
  const ready = useHydrated()
  const o = s.orders.find((x) => x.id === id)
  if (!ready) return <div className="wrap page-pad" />
  if (!o) return <div className="wrap empty page-pad"><h1>Pedido não encontrado</h1><Link className="btn" href="/produtos">Ver coleção</Link></div>
  return (
    <div className="wrap done">
      <span className="eyebrow">Pedido de teste registrado</span>
      <h1>{o.id}</h1>
      <Wave seed={o.total % 17} bars={120} />
      <p>{o.items.reduce((n, i) => n + i.qty, 0)} peças · {brl(o.total)}</p>
      <p className="muted">O pedido já está no painel da loja. Abra o Painel em outra aba para ver a chegada em tempo real.</p>
      <div className="done-cta">
        <Link className="btn" href="/painel/pedidos">Ver no painel da loja</Link>
        <Link className="btn btn-ghost" href={`/conta/pedidos/${o.id}`}>Acompanhar como cliente</Link>
      </div>
    </div>
  )
}
