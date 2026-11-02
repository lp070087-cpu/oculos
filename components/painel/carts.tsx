'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, MessageCircle, X } from 'lucide-react'
import { brl } from '@/lib/catalog'
import { demo } from '@/lib/demo/store'
import { APP_MODE } from '@/lib/store-facts'
import { CONSENT_LABEL, MIN, STATUS_LABEL, abandonedAt, cartStatus, consentOf, eligibility, suggestedMessage, type CartStatus, type Consent } from '@/lib/recovery'
import { fmtDateTime, toast } from '@/lib/ui'
import { Modal, Pill } from '@/components/ui'
import type { DemoState, RecoveryAttempt, TrackedCart } from '@/lib/demo/types'

const STATUS_TONE = { ativo: 'neutral', abandonado: 'warn', recuperado: 'ok', convertido: 'violet' } as const
const CONSENT_TONE = { autorizado: 'ok', 'sem-autorizacao': 'bad', descadastrado: 'bad', anonimo: 'neutral' } as const
const RESULT: Record<RecoveryAttempt['result'], { label: string; tone: 'gold' | 'violet' | 'ok' | 'bad' }> = {
  preparada: { label: 'Mensagem preparada', tone: 'gold' },
  simulada: { label: 'Envio simulado', tone: 'violet' },
  enviada: { label: 'Enviada', tone: 'ok' },
  falhou: { label: 'Falhou', tone: 'bad' },
}
const PERIODS = { todos: 'Todo o período', '1': 'Últimas 24 horas', '7': 'Últimos 7 dias', '30': 'Últimos 30 dias' } as const
const VALUES = { todos: 'Qualquer valor', baixo: 'Até R$ 300', medio: 'R$ 300 a R$ 600', alto: 'Acima de R$ 600' } as const
const IDLE = [30, 60, 120, 240, 1440]

function ago(ms: number) {
  const m = Math.max(1, Math.round(ms / MIN))
  if (m < 60) return `há ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`
  const d = Math.floor(h / 24)
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`
}

/** Relógio da tela: o status muda sozinho quando um carrinho passa do tempo limite. */
function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30_000); return () => clearInterval(t) }, [])
  return now
}

type Row = { c: TrackedCart; status: CartStatus; consent: Consent; name: string; pieces: number }

export function AbandonedCarts({ s }: { s: DemoState }) {
  const now = useNow()
  const idle = s.recovery.idleMinutes
  const [period, setPeriod] = useState<keyof typeof PERIODS>('todos')
  const [value, setValue] = useState<keyof typeof VALUES>('todos')
  const [status, setStatus] = useState<CartStatus | 'todos'>('todos')
  const [view, setView] = useState<string | null>(null)
  const [compose, setCompose] = useState<string | null>(null)

  const rows: Row[] = useMemo(() => s.carts.filter((c) => c.lines.length > 0).map((c) => {
    const customer = s.customers.find((x) => x.id === c.customerId)
    return { c, status: cartStatus(c, now, idle), consent: consentOf(customer), name: customer?.name ?? 'Visitante anônimo', pieces: c.lines.reduce((n, l) => n + l.qty, 0) }
  }).sort((a, b) => b.c.lastActivity - a.c.lastActivity), [s.carts, s.customers, now, idle])

  // Recuperado só com pedido real e não cancelado. Abandonados contam também os que depois viraram pedido.
  const orderOf = (c: TrackedCart) => s.orders.find((o) => o.id === c.orderId && o.status !== 'cancelado')
  const everAbandoned = rows.filter((r) => r.status === 'abandonado' || r.status === 'recuperado')
  const open = rows.filter((r) => r.status === 'abandonado')
  const recovered = rows.filter((r) => r.status === 'recuperado' && orderOf(r.c))
  const revenue = recovered.reduce((n, r) => n + (orderOf(r.c)?.total ?? 0), 0)
  const rate = everAbandoned.length ? (recovered.length / everAbandoned.length) * 100 : 0

  const list = rows.filter((r) => {
    if (status !== 'todos' && r.status !== status) return false
    if (period !== 'todos' && now - r.c.lastActivity > Number(period) * 24 * 60 * MIN) return false
    if (value === 'baixo' && r.c.total > 300) return false
    if (value === 'medio' && (r.c.total <= 300 || r.c.total > 600)) return false
    if (value === 'alto' && r.c.total <= 600) return false
    return true
  })

  const viewing = rows.find((r) => r.c.id === view)
  const composing = rows.find((r) => r.c.id === compose)

  return (
    <>
      {APP_MODE !== 'production' && <div className="demo-note">Modo demonstração: carrinhos e clientes fictícios. As mensagens são apenas simuladas e registradas; nada é enviado pelo WhatsApp.</div>}
      <div className="kpis kpis-5">
        <div className="kpi"><span>Carrinhos abandonados</span><b>{everAbandoned.length}</b><small>{open.length} ainda em aberto</small></div>
        <div className="kpi"><span>Valor potencial</span><b>{brl(open.reduce((n, r) => n + r.c.total, 0))}</b><small>Carrinhos em aberto</small></div>
        <div className="kpi"><span>Recuperados</span><b>{recovered.length}</b><small>Viraram pedido</small></div>
        <div className="kpi"><span>Receita recuperada</span><b>{brl(revenue)}</b><small>Só pedidos confirmados</small></div>
        <div className="kpi"><span>Taxa de recuperação</span><b>{rate.toFixed(0)}%</b><small>Recuperados ÷ abandonados</small></div>
      </div>

      <section className="panel">
        <div className="panel-h">
          Carrinhos
          <label className="goal">Abandonado após
            <span><select value={idle} onChange={(e) => { demo.setIdleMinutes(Number(e.target.value)); toast('Tempo de inatividade atualizado') }} aria-label="Tempo de inatividade">
              {IDLE.map((m) => <option key={m} value={m}>{m < 60 ? `${m} min` : m === 1440 ? '24 horas' : `${m / 60} ${m === 60 ? 'hora' : 'horas'}`}</option>)}
            </select></span>
          </label>
        </div>
        <div className="cart-filters">
          <label className="field"><span>Data</span><select value={period} onChange={(e) => setPeriod(e.target.value as keyof typeof PERIODS)}>{Object.entries(PERIODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="field"><span>Valor</span><select value={value} onChange={(e) => setValue(e.target.value as keyof typeof VALUES)}>{Object.entries(VALUES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="field"><span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as CartStatus | 'todos')}>
              <option value="todos">Todos</option>
              {(Object.keys(STATUS_LABEL) as CartStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
            </select>
          </label>
        </div>
        {list.length === 0 ? <div className="empty"><p>Nenhum carrinho com esses filtros.</p></div> : (
          <ul className="cart-rows">
            {list.map((r) => {
              const last = r.c.attempts.at(-1)
              return (
                <li key={r.c.id} data-cart={r.c.id}>
                  <div className="cart-who">
                    <b>{r.name}</b>
                    <small>{r.c.id} · {r.pieces} peças · {ago(now - r.c.lastActivity)}</small>
                  </div>
                  <div className="cart-thumbs" aria-hidden>{r.c.lines.slice(0, 3).map((l) => <img key={l.slug} src={l.image} alt="" />)}</div>
                  <b className="cart-total">{brl(r.c.total)}</b>
                  <div className="cart-pills">
                    <Pill tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Pill>
                    <Pill tone={CONSENT_TONE[r.consent]}>{CONSENT_LABEL[r.consent]}</Pill>
                    {last && <Pill tone={RESULT[last.result].tone}>{RESULT[last.result].label}</Pill>}
                  </div>
                  <div className="cart-acts">
                    <button className="btn btn-ghost btn-sm" onClick={() => setView(r.c.id)}><Eye size={15} aria-hidden /> Ver carrinho</button>
                    {r.status === 'abandonado' && <button className="btn btn-sm" onClick={() => setCompose(r.c.id)}><MessageCircle size={15} aria-hidden /> Preparar mensagem</button>}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {viewing && <CartView s={s} row={viewing} now={now} onClose={() => setView(null)} onCompose={() => { setView(null); setCompose(viewing.c.id) }} />}
      {composing && <Compose s={s} row={composing} now={now} onClose={() => setCompose(null)} />}
    </>
  )
}

function CartView({ s, row, now, onClose, onCompose }: { s: DemoState; row: Row; now: number; onClose: () => void; onCompose: () => void }) {
  const { c } = row
  const at = abandonedAt(c, now, s.recovery.idleMinutes)
  const order = s.orders.find((o) => o.id === c.orderId)
  return (
    <Modal title={`Carrinho ${c.id}`} onClose={onClose}>
      <ul className="list-rows">
        {c.lines.map((l) => (
          <li key={l.slug}>
            <span className="prod-cell"><img src={l.image} alt="" /><span>{l.name}<small>{l.variant} · {l.qty} × {brl(l.price)}</small></span></span>
            <b>{brl(l.qty * l.price)}</b>
          </li>
        ))}
      </ul>
      <div className="row-between co-total" style={{ marginTop: 10 }}><span>Total do carrinho</span><b>{brl(c.total)}</b></div>
      <ul className="list-rows" style={{ marginTop: 14 }}>
        <li><span>Cliente</span><b>{row.name}</b></li>
        <li><span>Comunicação</span><Pill tone={CONSENT_TONE[row.consent]}>{CONSENT_LABEL[row.consent]}</Pill></li>
        <li><span>Status</span><Pill tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Pill></li>
        <li><span>Criado</span><span>{fmtDateTime(c.createdAt)}</span></li>
        <li><span>Última atividade</span><span>{fmtDateTime(c.lastActivity)}</span></li>
        {at && <li><span>Abandonado em</span><span>{fmtDateTime(at)}</span></li>}
        <li><span>Pedido relacionado</span>{order ? <Link className="text-btn" href="/painel/pedidos">{order.id} · {brl(order.total)}</Link> : <span className="muted">Nenhum</span>}</li>
      </ul>
      <h3 className="cart-h3">Tentativas de recuperação</h3>
      {c.attempts.length === 0 ? <p className="muted" style={{ fontSize: 14 }}>Nenhuma tentativa ainda.</p> : (
        <ul className="timeline">
          {[...c.attempts].reverse().map((a) => <li key={a.id}><Pill tone={RESULT[a.result].tone}>{RESULT[a.result].label}</Pill> <span className="muted">{a.mode === 'modelo' ? 'modelo aprovado' : 'texto livre'}</span><small>{fmtDateTime(a.at)} · {a.note}</small></li>)}
        </ul>
      )}
      {row.status === 'abandonado' && <button className="btn btn-block" style={{ marginTop: 16 }} onClick={onCompose}><MessageCircle size={16} aria-hidden /> Preparar mensagem</button>}
    </Modal>
  )
}

function Compose({ s, row, now, onClose }: { s: DemoState; row: Row; now: number; onClose: () => void }) {
  const { c } = row
  const customer = s.customers.find((x) => x.id === c.customerId)
  const conv = s.conversations.find((x) => x.customerId === c.customerId)
  const check = eligibility(c, customer, conv, now, s.recovery.idleMinutes)
  const link = typeof window !== 'undefined' ? `${location.origin}/retomar/${c.resumeToken}` : undefined
  const [text, setText] = useState(() => [...c.attempts].reverse().find((a) => a.result === 'preparada')?.text ?? suggestedMessage(customer?.name, link))
  const [busy, setBusy] = useState(false)
  const real = APP_MODE === 'production'

  const prepare = () => {
    demo.recordAttempt(c.id, { channel: 'whatsapp', mode: check.mode, text, result: 'preparada', note: 'Mensagem preparada, ainda não enviada' })
    toast('Mensagem preparada e salva no histórico')
    onClose()
  }
  const send = async () => {
    if (!check.ok || !text.trim()) return
    if (!real) {
      demo.recordAttempt(c.id, { channel: 'whatsapp', mode: check.mode, text, result: 'simulada', note: 'Envio simulado na demonstração: nada saiu pelo WhatsApp' })
      toast('Envio simulado. Nenhuma mensagem real foi enviada.', { href: `/painel/whatsapp?c=${conv?.id ?? `c-${customer?.id}`}`, action: 'Ver conversa' })
      onClose()
      return
    }
    // Produção: o servidor repete as checagens e só ele conhece o token da Meta.
    setBusy(true)
    const res = await fetch('/api/carrinhos/enviar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: c.resumeToken, text }) })
      .then((r) => r.json().then((j) => ({ ok: r.ok, ...j })))
      .catch(() => ({ ok: false, error: 'Sem resposta do servidor' }))
    setBusy(false)
    demo.recordAttempt(c.id, { channel: 'whatsapp', mode: check.mode, text, result: res.ok ? 'enviada' : 'falhou', note: res.ok ? 'Enviada pela API oficial' : String(res.error ?? 'Falha no envio') })
    toast(res.ok ? 'Mensagem enviada' : `Não enviada: ${res.error ?? 'falha no envio'}`)
    onClose()
  }

  return (
    <Modal title={`Mensagem para ${row.name}`} onClose={onClose}>
      <ul className="checks">
        {check.checks.map((k) => (
          <li key={k.label} className={k.ok ? 'ok' : 'no'}>
            {k.ok ? <Check size={16} aria-hidden /> : <X size={16} aria-hidden />}
            <span>{k.label}<small>{k.detail}</small></span>
          </li>
        ))}
      </ul>
      <p className="cart-window">{check.window}</p>
      {check.ok ? (
        <>
          <label className="field" style={{ marginTop: 14 }}><span>Mensagem (pode editar)</span><textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} /></label>
          {check.mode === 'modelo' && <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Na conexão real, fora da janela de 24h o texto vai como parâmetro do modelo aprovado e precisa seguir o conteúdo aprovado pela Meta.</p>}
          <div className="phone" style={{ marginTop: 14 }}>
            <div className="phone-bubble">{text}</div>
            <small>{real ? 'Será enviada pela API oficial do WhatsApp Business' : 'Prévia · modo demonstração, nada é enviado'}</small>
          </div>
          <div className="app-actions" style={{ marginTop: 16 }}>
            <button className="btn" onClick={send} disabled={busy || !text.trim()}>{real ? 'Confirmar envio' : 'Confirmar envio simulado'}</button>
            <button className="btn btn-ghost" onClick={prepare} disabled={!text.trim()}>Salvar como preparada</button>
          </div>
        </>
      ) : (
        <div className="cart-blocked" role="alert">
          <b>Envio bloqueado</b>
          <p>{row.consent === 'anonimo' ? 'Carrinho sem cliente identificado: entra nas estatísticas, mas não recebe mensagem direta.' : 'Este carrinho não cumpre as regras de contato acima. Nenhuma mensagem pode ser preparada ou enviada.'}</p>
        </div>
      )}
      {customer && row.consent === 'autorizado' && (
        <button className="text-btn" style={{ marginTop: 14 }} onClick={() => { demo.optOut(customer.id); toast('Descadastro registrado. Contatos bloqueados.'); onClose() }}>
          Cliente pediu para não receber mensagens
        </button>
      )}
    </Modal>
  )
}
