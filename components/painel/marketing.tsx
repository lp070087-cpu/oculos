'use client'

import { useState } from 'react'
import { brl } from '@/lib/catalog'
import { demo } from '@/lib/demo/store'
import { fmtDate, toast } from '@/lib/ui'
import { Pill } from '@/components/ui'
import type { DemoState } from '@/lib/demo/types'

const AUDIENCES: Record<string, (seg: string) => boolean> = {
  'Todos com consentimento': () => true,
  'VIP com consentimento': (s) => s === 'VIP',
  'Recorrentes com consentimento': (s) => s === 'Recorrente',
  'Novos com consentimento': (s) => s === 'Novo',
}
const BANNERS = [
  { id: 'new-frequency', name: 'Seu estilo. Sem fronteiras.' },
  { id: 'your-frequency', name: 'Your Style. Your Frequency.' },
]

export function Marketing({ s }: { s: DemoState }) {
  const [tab, setTab] = useState<'campanhas' | 'cupons' | 'banners'>('campanhas')
  return (
    <>
      <header className="app-top"><div><h1>Marketing</h1><p>Nada é enviado: as campanhas aqui são apenas simuladas</p></div></header>
      <div className="chips" style={{ marginBottom: 16 }}>
        {(['campanhas', 'cupons', 'banners'] as const).map((t) => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      {tab === 'campanhas' && <Campaigns s={s} />}
      {tab === 'cupons' && <Coupons s={s} />}
      {tab === 'banners' && (
        <div className="cols cols-even">
          {BANNERS.map((b) => (
            <section className="panel" key={b.id}>
              <h2>{b.name}</h2>
              <img src={`/banners/${b.id}-desktop.webp`} alt={`Capa do banner ${b.name}`} loading="lazy" />
              <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Versões desktop e mobile · WebM, MP4 e imagem estática</p>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

function Campaigns({ s }: { s: DemoState }) {
  const [name, setName] = useState('Flack 2.0 em promoção')
  const [audience, setAudience] = useState('Todos com consentimento')
  const [message, setMessage] = useState('Oi, {nome}! Flack 2.0 por R$ 39,00 a peça. Pedido mínimo de 6 peças, pode mesclar os modelos.')
  const [channel, setChannel] = useState<'template' | 'link'>('template')
  const [couponCode, setCoupon] = useState('')
  const consented = s.customers.filter((c) => c.marketingConsent)
  const recipients = consented.filter((c) => AUDIENCES[audience](c.segment))
  const blocked = s.customers.length - consented.length
  const preview = message.replace('{nome}', recipients[0]?.name.split(' ')[0] ?? 'cliente')
  const save = (status: 'rascunho' | 'simulada') => {
    demo.saveCampaign({ name, channel, audience, recipients: recipients.length, message, status, couponCode: couponCode || undefined })
    toast(status === 'simulada' ? 'Campanha simulada. Nada foi enviado.' : 'Rascunho salvo')
  }
  return (
    <div className="cols">
      <div>
        <section className="panel stack">
          <h2 style={{ marginBottom: 0 }}>Nova campanha</h2>
          <label className="field"><span>Nome</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <div className="form-grid" style={{ marginTop: 0 }}>
            <label className="field"><span>Público</span>
              <select value={audience} onChange={(e) => setAudience(e.target.value)}>{Object.keys(AUDIENCES).map((a) => <option key={a}>{a}</option>)}</select>
            </label>
            <label className="field"><span>Canal</span>
              <select value={channel} onChange={(e) => setChannel(e.target.value as 'template' | 'link')}>
                <option value="template">Modelo de marketing (API oficial)</option>
                <option value="link">Link para compartilhamento assistido</option>
              </select>
            </label>
          </div>
          <label className="field"><span>Mensagem</span><textarea value={message} onChange={(e) => setMessage(e.target.value)} /></label>
          <label className="field"><span>Cupom (opcional)</span>
            <select value={couponCode} onChange={(e) => setCoupon(e.target.value)}>
              <option value="">Sem cupom</option>
              {s.coupons.filter((c) => c.active).map((c) => <option key={c.code}>{c.code}</option>)}
            </select>
          </label>
          <p className="muted" style={{ fontSize: 13 }}>{recipients.length} destinatários com consentimento. {blocked} contato(s) sem consentimento ficam de fora.</p>
          <div className="app-actions">
            <button className="btn" onClick={() => save('simulada')}>Simular envio</button>
            <button className="btn btn-ghost" onClick={() => save('rascunho')}>Salvar rascunho</button>
          </div>
        </section>
        <section className="panel">
          <h2>Campanhas</h2>
          <ul className="list-rows">
            {s.campaigns.map((c) => <li key={c.id}><span>{c.name}<small>{c.audience} · {c.recipients} destinatários · {fmtDate(c.createdAt)}</small></span><Pill tone={c.status === 'simulada' ? 'violet' : 'neutral'}>{c.status === 'simulada' ? 'Simulada' : 'Rascunho'}</Pill></li>)}
          </ul>
        </section>
      </div>
      <section className="panel">
        <h2>Prévia da comunicação</h2>
        <div className="phone">
          <div className="phone-bubble">{preview}{couponCode ? `\n\nCupom: ${couponCode}` : ''}</div>
          <small>{channel === 'template' ? 'Modelo sujeito à aprovação da Meta' : 'Link aberto e enviado manualmente'}</small>
        </div>
      </section>
    </div>
  )
}

function Coupons({ s }: { s: DemoState }) {
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('10')
  return (
    <div className="cols">
      <section className="panel">
        <h2>Cupons</h2>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Código</th><th>Desconto</th><th>Usos</th><th>Ativo</th></tr></thead>
            <tbody>
              {s.coupons.map((c) => (
                <tr key={c.code}>
                  <td>{c.code}</td>
                  <td>{c.kind === 'percent' ? `${c.value}%` : brl(c.value)}</td>
                  <td>{c.uses}</td>
                  <td><button className="switch" role="switch" aria-checked={c.active} aria-label={`Ativar ${c.code}`} onClick={() => demo.toggleCoupon(c.code)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <form className="panel stack" onSubmit={(e) => {
        e.preventDefault()
        if (!code.trim()) return
        demo.saveCoupon({ code: code.trim().toUpperCase(), kind, value: Number(value), active: true, uses: 0, note: 'Cupom criado na demonstração' })
        setCode('')
        toast('Cupom criado')
      }}>
        <h2 style={{ marginBottom: 0 }}>Novo cupom</h2>
        <label className="field"><span>Código</span><input value={code} onChange={(e) => setCode(e.target.value)} /></label>
        <label className="field"><span>Tipo</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as 'percent' | 'fixed')}><option value="percent">Percentual</option><option value="fixed">Valor fixo</option></select>
        </label>
        <label className="field"><span>Valor</span><input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} /></label>
        <button className="btn">Criar cupom</button>
      </form>
    </div>
  )
}
