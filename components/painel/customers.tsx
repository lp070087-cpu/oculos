'use client'

import { useState } from 'react'
import Link from 'next/link'
import { brl } from '@/lib/catalog'
import { demo } from '@/lib/demo/store'
import { fmtDate, toast } from '@/lib/ui'
import { Modal, ORDER_LABEL, Pill, orderTone } from '@/components/ui'
import type { Customer, DemoState } from '@/lib/demo/types'

const SEGMENTS: Customer['segment'][] = ['Novo', 'Recorrente', 'VIP', 'Inativo']

export function Customers({ s }: { s: DemoState }) {
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState<string>('')
  const [open, setOpen] = useState<string | null>(null)
  const list = s.customers.filter((c) => (!seg || c.segment === seg) && `${c.name} ${c.business} ${c.city}`.toLowerCase().includes(q.toLowerCase()))
  const spent = (id: string) => s.orders.filter((o) => o.customerId === id && o.status !== 'cancelado').reduce((n, o) => n + o.total, 0)
  const current = s.customers.find((c) => c.id === open)
  return (
    <>
      <header className="app-top"><div><h1>Clientes</h1><p>Lojistas fictícios da demonstração</p></div></header>
      <div className="toolbar"><input className="input" placeholder="Buscar cliente, loja ou cidade" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar cliente" /></div>
      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={!seg ? 'on' : ''} onClick={() => setSeg('')}>Todos ({s.customers.length})</button>
        {SEGMENTS.map((x) => <button key={x} className={seg === x ? 'on' : ''} onClick={() => setSeg(x)}>{x} ({s.customers.filter((c) => c.segment === x).length})</button>)}
      </div>
      <section className="panel">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Cliente</th><th>Cidade</th><th>Segmento</th><th>Marketing</th><th className="num">Total comprado</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="click" onClick={() => setOpen(c.id)}>
                  <td><button className="text-btn" onClick={() => setOpen(c.id)}>{c.name}</button><br /><small className="muted">{c.business}</small></td>
                  <td>{c.city}</td>
                  <td><Pill tone={c.segment === 'VIP' ? 'gold' : c.segment === 'Inativo' ? 'bad' : 'neutral'}>{c.segment}</Pill></td>
                  <td>{c.marketingConsent ? <Pill tone="ok">Autorizado</Pill> : <Pill>Sem consentimento</Pill>}</td>
                  <td className="num">{brl(spent(c.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {current && <Detail key={current.id} c={current} s={s} onClose={() => setOpen(null)} />}
    </>
  )
}

function Detail({ c, s, onClose }: { c: Customer; s: DemoState; onClose: () => void }) {
  const [notes, setNotes] = useState(c.notes)
  const orders = s.orders.filter((o) => o.customerId === c.id)
  const conv = s.conversations.find((x) => x.customerId === c.id)
  return (
    <Modal title={c.name} onClose={onClose}>
      <div className="stack">
        <p className="muted" style={{ fontSize: 14 }}>{c.business} · {c.city} · {c.phone} · {c.email}</p>
        <label className="field"><span>Segmento</span>
          <select value={c.segment} onChange={(e) => demo.updateCustomer(c.id, { segment: e.target.value as Customer['segment'] })}>{SEGMENTS.map((x) => <option key={x}>{x}</option>)}</select>
        </label>
        <label className="field"><span>Observações comerciais</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <div className="app-actions">
          <button className="btn btn-sm" onClick={() => { demo.updateCustomer(c.id, { notes }); toast('Observação salva') }}>Salvar observação</button>
          {conv && <Link className="btn btn-ghost btn-sm" href={`/painel/whatsapp?c=${conv.id}`}>Abrir conversa</Link>}
        </div>
        <div>
          <h3 style={{ fontSize: 15, marginBottom: 6 }}>Histórico de compras</h3>
          {orders.length === 0 && <p className="muted">Nenhuma compra.</p>}
          <ul className="list-rows">
            {orders.map((o) => <li key={o.id}><span>{o.id}<small>{fmtDate(o.createdAt)}</small></span><span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Pill tone={orderTone(o.status)}>{ORDER_LABEL[o.status]}</Pill><b>{brl(o.total)}</b></span></li>)}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
