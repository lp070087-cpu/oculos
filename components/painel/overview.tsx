'use client'

import Link from 'next/link'
import { useState } from 'react'
import { brl, imgUrl } from '@/lib/catalog'
import { catalog } from '@/lib/demo/store'
import { fmtDateTime, toast } from '@/lib/ui'
import { ORDER_LABEL, Pill, orderTone } from '@/components/ui'
import { GoalSetting, SalesChart } from '@/components/painel/chart'
import type { DemoState, Order } from '@/lib/demo/types'

const DAY = 86_400_000
const valid = (o: Order) => o.status !== 'cancelado'
export const paid = (o: Order) => valid(o) && o.paymentStatus === 'pago'

/** Referência fixa dos dados fictícios, somada à hora real quando há pedidos novos. */
const anchor = (s: DemoState) => Math.max(...s.orders.map((o) => o.createdAt))

function series(s: DemoState, days: number, offset = 0) {
  const end = anchor(s) - offset * DAY
  return Array.from({ length: days }, (_, i) => {
    const to = end - (days - 1 - i) * DAY
    const from = to - DAY
    const list = s.orders.filter((o) => valid(o) && o.createdAt > from && o.createdAt <= to)
    return { to, value: list.reduce((n, o) => n + o.total, 0), count: list.length }
  })
}

export function Overview({ s }: { s: DemoState }) {
  const sales = series(s, 14)
  const total = sales.reduce((n, d) => n + d.value, 0)
  const count = sales.reduce((n, d) => n + d.count, 0)
  const open = s.orders.filter((o) => o.status === 'novo' || o.status === 'separacao').length
  const items = catalog(s)
  const low = items.filter((p) => !p.soldOut && (s.stock[p.slug] ?? 0) <= s.lowStockAt)
  const ranking = Object.values(
    s.orders.filter(valid).flatMap((o) => o.items).reduce<Record<string, { name: string; image: string; qty: number }>>((acc, i) => {
      acc[i.slug] = { name: i.name, image: i.image, qty: (acc[i.slug]?.qty ?? 0) + i.qty }
      return acc
    }, {}),
  ).sort((a, b) => b.qty - a.qty).slice(0, 5)
  return (
    <>
      <header className="app-top"><div><h1>Visão geral</h1><p>Últimos 14 dias · dados fictícios de demonstração</p></div></header>
      <div className="kpis">
        <div className="kpi"><span>Vendas</span><b>{brl(total)}</b></div>
        <div className="kpi"><span>Pedidos</span><b>{count}</b></div>
        <div className="kpi"><span>Ticket médio</span><b>{brl(count ? total / count : 0)}</b></div>
        <div className="kpi"><span>A separar</span><b>{open}</b></div>
      </div>
      <div className="cols">
        <div>
          <section className="panel"><div className="panel-h">Vendas por dia <GoalSetting goal={s.salesGoal} /></div><SalesChart data={sales} goal={s.salesGoal} /></section>
          <section className="panel">
            <div className="panel-h">Pedidos recentes <Link className="text-btn" href="/painel/pedidos">Ver todos</Link></div>
            <div className="tbl-wrap">
              <table>
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Status</th><th className="num">Total</th></tr></thead>
                <tbody>{s.orders.slice(0, 6).map((o) => <tr key={o.id}><td>{o.id}</td><td>{o.customerName}</td><td><Pill tone={orderTone(o.status)}>{ORDER_LABEL[o.status]}</Pill></td><td className="num">{brl(o.total)}</td></tr>)}</tbody>
              </table>
            </div>
          </section>
        </div>
        <div>
          <section className="panel">
            <div className="panel-h">Alertas <Link className="text-btn" href="/painel/produtos">Estoque</Link></div>
            <ul className="list-rows">
              {low.slice(0, 4).map((p) => <li key={p.slug}><span>{p.name}<small>Estoque baixo</small></span><Pill tone="warn">{s.stock[p.slug] ?? 0}</Pill></li>)}
              {low.length === 0 && <li className="muted">Nenhum alerta.</li>}
            </ul>
          </section>
          <section className="panel">
            <h2>Mais vendidos</h2>
            <ul className="list-rows">
              {ranking.map((r) => <li key={r.name}><span className="prod-cell" style={{ minWidth: 0 }}><img src={imgUrl(r.image)} alt="" /><span>{r.name}</span></span><b>{r.qty}</b></li>)}
            </ul>
          </section>
          <section className="panel">
            <h2>Atividades</h2>
            <ul className="list-rows">{s.activity.slice(0, 6).map((a) => <li key={a.id}><span>{a.text}<small>{fmtDateTime(a.at)}</small></span></li>)}</ul>
          </section>
        </div>
      </div>
    </>
  )
}

export function Finance({ s }: { s: DemoState }) {
  const [days, setDays] = useState(14)
  const cur = series(s, days)
  const prev = series(s, days, days)
  const sum = (x: { value: number }[]) => x.reduce((n, d) => n + d.value, 0)
  const a = sum(cur)
  const b = sum(prev)
  const change = b ? ((a - b) / b) * 100 : 0
  const received = s.orders.filter(paid).reduce((n, o) => n + o.total, 0)
  const pending = s.orders.filter((o) => valid(o) && o.paymentStatus === 'pendente').reduce((n, o) => n + o.total, 0)
  const byPay = (['pix', 'cartao', 'whatsapp'] as const).map((k) => ({ k, v: s.orders.filter((o) => valid(o) && o.payment === k).reduce((n, o) => n + o.total, 0) }))
  const label = { pix: 'Pix (teste)', cartao: 'Cartão (teste)', whatsapp: 'Combinado no WhatsApp' }
  const csv = () => {
    const rows = [['pedido', 'cliente', 'status', 'pagamento', 'total'], ...s.orders.map((o) => [o.id, o.customerName, o.status, o.paymentStatus, o.total.toFixed(2)])]
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(';')).join('\n')], { type: 'text/csv' }))
    Object.assign(document.createElement('a'), { href: url, download: 'relatorio-demo.csv' }).click()
    URL.revokeObjectURL(url)
    toast('Relatório gerado')
  }
  return (
    <>
      <header className="app-top">
        <div><h1>Financeiro</h1><p>Valores fictícios. Nenhuma transação real.</p></div>
        <div className="app-actions">
          {[7, 14].map((d) => <button key={d} className={`mini ${days === d ? 'on' : ''}`} style={{ minHeight: 38 }} onClick={() => setDays(d)}>{d} dias</button>)}
          <button className="btn btn-ghost btn-sm" onClick={csv}>Exportar CSV</button>
        </div>
      </header>
      <div className="kpis">
        <div className="kpi"><span>Vendas no período</span><b>{brl(a)}</b><small>{b ? `${change >= 0 ? '+' : ''}${change.toFixed(0)}% sobre o período anterior` : 'Sem período anterior'}</small></div>
        <div className="kpi"><span>Recebido</span><b>{brl(received)}</b></div>
        <div className="kpi"><span>A receber</span><b>{brl(pending)}</b></div>
        <div className="kpi"><span>Frete cobrado</span><b>{brl(s.orders.filter(valid).reduce((n, o) => n + o.shipping, 0))}</b></div>
      </div>
      <div className="cols">
        <section className="panel"><div className="panel-h">Comparativo <GoalSetting goal={s.salesGoal} /></div><SalesChart data={cur} compare={prev} goal={s.salesGoal} /></section>
        <section className="panel">
          <h2>Por forma de pagamento</h2>
          <ul className="list-rows">{byPay.map((p) => <li key={p.k}><span>{label[p.k]}</span><b>{brl(p.v)}</b></li>)}</ul>
        </section>
      </div>
    </>
  )
}
