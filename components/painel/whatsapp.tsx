'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Bot, Check, Pencil, Send, UserRound, X } from 'lucide-react'
import { brl } from '@/lib/catalog'
import { suggestReply } from '@/lib/ai'
import { demo } from '@/lib/demo/store'
import { fmtTime, toast } from '@/lib/ui'
import { ORDER_LABEL, Pill, orderTone } from '@/components/ui'
import type { Conversation, DemoState } from '@/lib/demo/types'

const TABS = [['inbox', 'Caixa de entrada'], ['conexao', 'Conexão'], ['automacoes', 'Automações'], ['grupos', 'Grupos'], ['metricas', 'Métricas']] as const
const TAGS = ['Lead', 'Atacado', 'VIP', 'Pedido aberto', 'Carrinho abandonado', 'Pós-venda']

export function WhatsApp({ s }: { s: DemoState }) {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>('inbox')
  return (
    <>
      <header className="app-top">
        <div><h1>Central WhatsApp</h1><p>Simulação. Nenhuma mensagem real é enviada ou recebida.</p></div>
        <Pill tone={s.whatsapp.step === 3 ? 'ok' : 'warn'}>{s.whatsapp.step === 3 ? 'Conectado (simulado)' : 'Não conectado'}</Pill>
      </header>
      <div className="chips" style={{ marginBottom: 14 }}>
        {TABS.map(([id, label]) => <button key={id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === 'inbox' && <Inbox s={s} />}
      {tab === 'conexao' && <Connection s={s} />}
      {tab === 'automacoes' && <Automations s={s} />}
      {tab === 'grupos' && <Groups />}
      {tab === 'metricas' && <Metrics s={s} />}
    </>
  )
}

function Inbox({ s }: { s: DemoState }) {
  const sp = useSearchParams()
  const [active, setActive] = useState(sp.get('c') ?? s.conversations[0]?.id)
  const [q, setQ] = useState('')
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string | null>(null)
  const list = s.conversations.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()))
  const conv = s.conversations.find((c) => c.id === active)
  const end = useRef<HTMLDivElement>(null)
  const lastId = conv?.messages.at(-1)?.id
  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest' }) }, [lastId, active])
  useEffect(() => { if (conv?.unread) demo.updateConversation(conv.id, { unread: 0 }) }, [conv?.id, conv?.unread])
  useEffect(() => { setDraft(null); setDismissed(null) }, [active, lastId])

  const needsReply = conv && conv.messages.at(-1)?.from !== 'atendente' && conv.messages.at(-1)?.from !== 'ia'
  const ai = useMemo(() => (conv && needsReply && dismissed !== lastId ? suggestReply(conv, s) : null), [conv, needsReply, dismissed, lastId, s])
  const customer = s.customers.find((c) => c.id === conv?.customerId)
  const orders = s.orders.filter((o) => o.customerId === conv?.customerId).slice(0, 3)

  const send = (from: 'atendente' | 'ia', t: string) => {
    if (!conv || !t.trim()) return
    demo.sendMessage(conv.id, from, t.trim())
    setText(''); setDraft(null)
  }

  return (
    <div className="chat">
      <div className="chat-list">
        <div><input className="input" placeholder="Buscar contato" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar contato" /></div>
        <ul>
          {list.map((c) => (
            <li key={c.id}>
              <button className={c.id === active ? 'on' : ''} onClick={() => setActive(c.id)}>
                <b>{c.name}</b>
                <small>{c.mode === 'ia' ? 'IA' : 'Humano'}</small>
                <span className="chat-prev">{c.messages.at(-1)?.text}</span>
                {c.unread > 0 && <span className="chat-count" style={{ gridColumn: 2 }}>{c.unread}</span>}
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="srch-none">Nenhum contato.</li>}
        </ul>
      </div>
      {conv ? (
        <div className="chat-main">
          <div className="chat-head">
            <div><h3>{conv.name}</h3><small>{conv.phone}</small></div>
            <div className="app-actions">
              {conv.mode === 'ia'
                ? <button className="btn btn-ghost btn-sm" onClick={() => { demo.updateConversation(conv.id, { mode: 'humano', assignee: 'Atendente demo' }); toast('Conversa transferida para atendente') }}><UserRound size={15} aria-hidden /> Assumir atendimento</button>
                : <button className="btn btn-ghost btn-sm" onClick={() => { demo.updateConversation(conv.id, { mode: 'ia', assignee: undefined }); toast('Conversa devolvida à IA') }}><Bot size={15} aria-hidden /> Devolver à IA</button>}
              <button className="btn btn-ghost btn-sm" onClick={() => demo.simulateIncoming(conv.id, 'Pode me passar as novidades da semana?')}>Simular mensagem</button>
            </div>
          </div>
          <div className="chat-msgs" aria-live="polite">
            {conv.messages.map((m) => (
              <div key={m.id} className={`msg ${m.from === 'atendente' ? 'msg-me' : m.from === 'ia' ? 'msg-ia' : m.from === 'sistema' ? 'msg-sys' : ''}`}>
                {m.text}
                <small>{{ cliente: conv.name, atendente: 'Atendente', ia: 'IA aprovada', sistema: 'Sistema' }[m.from]} · {fmtTime(m.at)}</small>
              </div>
            ))}
            <div ref={end} />
          </div>
          {ai && (
            <div className="ai-box">
              <h4><Bot size={15} aria-hidden /> Sugestão da IA demonstrativa</h4>
              {draft === null ? <p>{ai.text}</p> : <textarea value={draft} onChange={(e) => setDraft(e.target.value)} aria-label="Editar sugestão" autoFocus />}
              <small>Base: {ai.reason}</small>
              <div className="ai-acts">
                <button className="btn btn-sm" onClick={() => send('ia', draft ?? ai.text)}>{draft === null ? <><Check size={15} aria-hidden /> Aprovar e enviar</> : <><Send size={15} aria-hidden /> Enviar editada</>}</button>
                {draft === null && <button className="btn btn-ghost btn-sm" onClick={() => setDraft(ai.text)}><Pencil size={15} aria-hidden /> Editar</button>}
                <button className="btn btn-ghost btn-sm" onClick={() => { setDismissed(lastId ?? null); setDraft(null) }}><X size={15} aria-hidden /> Descartar</button>
              </div>
            </div>
          )}
          <form className="composer" onSubmit={(e) => { e.preventDefault(); send('atendente', text) }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Responder como atendente" aria-label="Resposta" />
            <button className="btn" aria-label="Enviar"><Send size={17} aria-hidden /></button>
          </form>
        </div>
      ) : <div className="empty"><p>Selecione uma conversa.</p></div>}
      {conv && (
        <aside className="chat-aside">
          <h4>Cliente</h4>
          {customer ? <p>{customer.business}<br /><span className="muted">{customer.city} · {customer.segment}</span></p> : <p className="muted">Contato não identificado</p>}
          <h4>Etiquetas</h4>
          <div className="tags">
            {TAGS.map((t) => {
              const on = conv.tags.includes(t)
              return <button key={t} className={on ? 'on' : ''} aria-pressed={on} onClick={() => demo.updateConversation(conv.id, { tags: on ? conv.tags.filter((x) => x !== t) : [...conv.tags, t] })}>{t}</button>
            })}
          </div>
          <h4>Pedidos</h4>
          {orders.length === 0 && <p className="muted">Nenhum pedido.</p>}
          <ul className="list-rows">
            {orders.map((o) => <li key={o.id}><Link href="/painel/pedidos">{o.id}<small>{brl(o.total)}</small></Link><Pill tone={orderTone(o.status)}>{ORDER_LABEL[o.status]}</Pill></li>)}
          </ul>
          {customer && (
            <>
              <h4>Consentimento</h4>
              <p className="muted">{customer.marketingConsent ? 'Autorizou marketing e carrinho abandonado' : 'Sem autorização de marketing'}</p>
            </>
          )}
        </aside>
      )}
    </div>
  )
}

const STEPS = [
  { t: 'Conta comercial', d: 'Portfólio empresarial da Meta verificado' },
  { t: 'Número', d: 'Número dedicado registrado na Cloud API' },
  { t: 'Modelos', d: 'Modelos de mensagem aprovados pela Meta' },
  { t: 'Webhook', d: 'Recebimento de mensagens no servidor' },
]

function Connection({ s }: { s: DemoState }) {
  const step = s.whatsapp.step
  return (
    <div className="cols">
      <section className="panel">
        <h2>Integração planejada com a API oficial</h2>
        <p className="muted" style={{ fontSize: 14 }}>Esta tela simula o processo. A conexão real depende de credenciais da loja e de aprovação da Meta.</p>
        <div className="steps">{STEPS.map((x, i) => <div key={x.t} className={i <= step ? 'on' : ''}>{x.t}</div>)}</div>
        <ul className="list-rows">
          {STEPS.map((x, i) => <li key={x.t}><span>{x.t}<small>{x.d}</small></span>{i < step || step === 3 ? <Pill tone="ok">Simulado</Pill> : i === step ? <Pill tone="gold">Próximo</Pill> : <Pill>Pendente</Pill>}</li>)}
        </ul>
        <div className="app-actions" style={{ marginTop: 14 }}>
          {step < 3 && <button className="btn" onClick={() => demo.setWhatsappStep((step + 1) as 1 | 2 | 3)}>Avançar simulação</button>}
          {step === 3 && <button className="btn btn-ghost" onClick={() => demo.setWhatsappStep(0)}>Desconectar simulação</button>}
        </div>
      </section>
      <section className="panel">
        <h2>Modo atual</h2>
        <ul className="list-rows">
          <li><span>Provedor</span><b>Demo local</b></li>
          <li><span>Mensagens reais</span><b>Desligadas</b></li>
          <li><span>Credenciais de produção</span><b>Nenhuma</b></li>
        </ul>
      </section>
    </div>
  )
}

function Automations({ s }: { s: DemoState }) {
  return (
    <div className="cols">
      <section className="panel">
        <h2>Respostas automáticas</h2>
        <div className="stack">
          {s.autoReplies.map((r) => (
            <div key={r.id}>
              <div className="row-between" style={{ marginBottom: 6 }}>
                <b style={{ fontSize: 14 }}>{r.trigger}</b>
                <button className="switch" role="switch" aria-checked={r.active} aria-label={`Ativar ${r.trigger}`} onClick={() => demo.toggleAutoReply(r.id)} />
              </div>
              <label className="field"><span className="sr-only">Resposta</span><textarea value={r.reply} onChange={(e) => demo.updateAutoReply(r.id, e.target.value)} /></label>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <h2>Carrinho abandonado</h2>
        <p className="muted" style={{ fontSize: 14, marginBottom: 12 }}>Só contatos que autorizaram, com modelo aprovado e dentro das regras da Meta. Sempre com opção de sair.</p>
        <ul className="list-rows">
          {s.conversations.filter((c) => c.tags.includes('Carrinho abandonado')).map((c) => <li key={c.id}><span>{c.name}<small>Sugestão pronta na caixa de entrada</small></span></li>)}
        </ul>
        <Link className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} href="/painel/marketing/carrinhos-abandonados">Abrir carrinhos abandonados</Link>
      </section>
    </div>
  )
}

function Groups() {
  const [copied, setCopied] = useState(false)
  const text = 'Promoção Oliveira OKL: Flack 2.0 por R$ 39,00. Mínimo de 6 peças, pode mesclar os modelos.'
  return (
    <>
      <div className="demo-note">Consulta à documentação oficial da Meta, atualizada em 15/10/2026. A API não publica em grupos comuns já existentes no WhatsApp da loja.</div>
      <div className="limits">
        <div><b>8</b><span>participantes por grupo, no máximo</span></div>
        <div><b>Conta oficial</b><span>exige conta comercial oficial (OBA)</span></div>
        <div><b>Convite</b><span>entrada apenas por link enviado ao contato</span></div>
        <div><b>Sem interativas</b><span>botões e listas não funcionam em grupos</span></div>
      </div>
      <div className="cols">
        <section className="panel">
          <h2>Alternativas compatíveis</h2>
          <ul className="list-rows">
            <li><span>Campanhas para listas com consentimento<small>Modelos aprovados pela API oficial, um a um</small></span><Link className="text-btn" href="/painel/marketing">Abrir</Link></li>
            <li><span>Compartilhamento assistido<small>O painel prepara o texto e o atendente cola no grupo</small></span></li>
            <li><span>Links de campanha<small>Levam o cliente direto para a vitrine da promoção</small></span></li>
            <li><span>Grupos oficiais pequenos<small>Até 8 pessoas, para contas elegíveis, criados pela API</small></span></li>
          </ul>
        </section>
        <section className="panel">
          <h2>Compartilhamento assistido</h2>
          <div className="phone"><div className="phone-bubble">{text}</div><small>Publicado manualmente pelo atendente</small></div>
          <button className="btn btn-block" style={{ marginTop: 14 }} onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); setCopied(true); toast('Texto copiado') }}>{copied ? 'Copiado' : 'Copiar texto da promoção'}</button>
          <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Sem scraping, sem captura de sessão e sem automação não autorizada.</p>
        </section>
      </div>
    </>
  )
}

function Metrics({ s }: { s: DemoState }) {
  const all = s.conversations.flatMap((c: Conversation) => c.messages)
  const replies = all.filter((m) => m.from === 'ia' || m.from === 'atendente')
  const pending = s.conversations.filter((c) => c.messages.at(-1)?.from === 'cliente').length
  return (
    <>
      <div className="kpis">
        <div className="kpi"><span>Conversas</span><b>{s.conversations.length}</b></div>
        <div className="kpi"><span>Aguardando resposta</span><b>{pending}</b></div>
        <div className="kpi"><span>Respostas da IA aprovadas</span><b>{all.filter((m) => m.from === 'ia').length}</b></div>
        <div className="kpi"><span>Respostas enviadas</span><b>{replies.length}</b></div>
      </div>
      <section className="panel">
        <h2>Atendimento por modo</h2>
        <ul className="list-rows">
          <li><span>Com IA</span><b>{s.conversations.filter((c) => c.mode === 'ia').length}</b></li>
          <li><span>Com atendente</span><b>{s.conversations.filter((c) => c.mode === 'humano').length}</b></li>
        </ul>
      </section>
    </>
  )
}
