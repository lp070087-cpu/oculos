'use client'

import { useState } from 'react'
import { brl, imgUrl } from '@/lib/catalog'
import { demo } from '@/lib/demo/store'
import { fmtDateTime } from '@/lib/ui'
import { Modal, ORDER_LABEL, PAY_LABEL, Pill, orderTone, payTone } from '@/components/ui'
import type { DemoState, OrderStatus, PaymentStatus } from '@/lib/demo/types'

const STATUSES = Object.keys(ORDER_LABEL) as OrderStatus[]

export function Orders({ s }: { s: DemoState }) {
  const [filter, setFilter] = useState<OrderStatus | 'todos'>('todos')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const list = s.orders.filter((o) => (filter === 'todos' || o.status === filter) && `${o.id} ${o.customerName}`.toLowerCase().includes(q.toLowerCase()))
  const current = s.orders.find((o) => o.id === open)
  return (
    <>
      <header className="app-top"><div><h1>Pedidos</h1><p>Pedidos feitos na loja entram aqui em tempo real</p></div></header>
      <div className="toolbar">
        <input className="input" placeholder="Buscar pedido ou cliente" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar pedido" />
      </div>
      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={filter === 'todos' ? 'on' : ''} onClick={() => setFilter('todos')}>Todos ({s.orders.length})</button>
        {STATUSES.map((k) => <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{ORDER_LABEL[k]} ({s.orders.filter((o) => o.status === k).length})</button>)}
      </div>
      <section className="panel">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Peças</th><th>Pagamento</th><th>Status</th><th className="num">Total</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className={`click ${o.source === 'site' ? 'is-new' : ''}`} onClick={() => setOpen(o.id)}>
                  <td><button className="text-btn" onClick={() => setOpen(o.id)}>{o.id}</button></td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(o.createdAt)}</td>
                  <td>{o.customerName}</td>
                  <td>{o.items.reduce((n, i) => n + i.qty, 0)}</td>
                  <td><Pill tone={payTone(o.paymentStatus)}>{PAY_LABEL[o.paymentStatus]}</Pill></td>
                  <td><Pill tone={orderTone(o.status)}>{ORDER_LABEL[o.status]}</Pill></td>
                  <td className="num">{brl(o.total)}</td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="muted">Nenhum pedido neste filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      {current && (
        <Modal title={`Pedido ${current.id}`} onClose={() => setOpen(null)}>
          <div className="stack">
            <div className="cols cols-even">
              <div>
                <p><b>{current.customerName}</b></p>
                <p className="muted" style={{ fontSize: 14 }}>{current.phone}</p>
                <p className="muted" style={{ fontSize: 14 }}>{current.delivery === 'entrega' ? current.address : 'Retirada (opção demonstrativa)'}</p>
              </div>
              <div className="stack" style={{ gap: 8 }}>
                <label className="field"><span>Status do pedido</span>
                  <select value={current.status} onChange={(e) => demo.setOrderStatus(current.id, e.target.value as OrderStatus)}>
                    {STATUSES.map((k) => <option key={k} value={k}>{ORDER_LABEL[k]}</option>)}
                  </select>
                </label>
                <label className="field"><span>Pagamento</span>
                  <select value={current.paymentStatus} onChange={(e) => demo.setPaymentStatus(current.id, e.target.value as PaymentStatus)}>
                    {(Object.keys(PAY_LABEL) as PaymentStatus[]).map((k) => <option key={k} value={k}>{PAY_LABEL[k]}</option>)}
                  </select>
                </label>
              </div>
            </div>
            <ul className="list-rows">
              {current.items.map((i) => <li key={i.slug}><span className="prod-cell"><img src={imgUrl(i.image)} alt="" /><span>{i.name}<small>{i.qty} × {brl(i.price)}</small></span></span><b>{brl(i.qty * i.price)}</b></li>)}
            </ul>
            <div>
              <div className="row-between"><span className="muted">Subtotal</span><span>{brl(current.subtotal)}</span></div>
              {current.discount > 0 && <div className="row-between"><span className="muted">Desconto {current.coupon}</span><span>-{brl(current.discount)}</span></div>}
              <div className="row-between"><span className="muted">Frete</span><span>{brl(current.shipping)}</span></div>
              <div className="row-between co-total"><span>Total</span><b>{brl(current.total)}</b></div>
            </div>
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Histórico</h3>
              <ul className="timeline">{current.history.map((h, i) => <li key={i}>{h.text}<small>{fmtDateTime(h.at)}</small></li>)}</ul>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
