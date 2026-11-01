'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { demo } from '@/lib/demo/store'
import { DEMO_SERVICES, formatCep, onlyDigits } from '@/lib/shipping'
import { fmtDate, toast } from '@/lib/ui'
import { Pill } from '@/components/ui'
import type { DemoState, ShippingConfig } from '@/lib/demo/types'

type Status = {
  configured: boolean
  missing: string[]
  environment: string
  admin: boolean
  purchase: boolean
  connected: boolean
  expired?: boolean
  expiresAt?: number
  account?: { name: string; email?: string } | null
  settings?: Omit<ShippingConfig, 'demoConnection'>
}

const STATE: Record<string, { tone: 'ok' | 'bad' | 'warn'; label: string }> = {
  conectado: { tone: 'ok', label: 'Conectado' },
  expirado: { tone: 'bad', label: 'Autorização expirada' },
  desconectado: { tone: 'warn', label: 'Desconectado' },
}

export function ShippingSettings({ s }: { s: DemoState }) {
  const sp = useSearchParams()
  const [st, setSt] = useState<Status | null>(null)
  const [services, setServices] = useState(DEMO_SERVICES)
  const [code, setCode] = useState('')

  const load = () => fetch('/api/melhorenvio/status').then((r) => r.json()).then(setSt).catch(() => setSt(null))
  useEffect(() => { load() }, [])
  useEffect(() => {
    const r = sp.get('me')
    if (r === 'conectado') toast('Melhor Envio conectado')
    if (r === 'erro') toast('Não foi possível concluir a autorização')
  }, [sp])

  const real = !!st?.configured
  useEffect(() => {
    if (st?.connected) fetch('/api/melhorenvio/services').then((r) => r.json()).then((d) => Array.isArray(d) && setServices(d)).catch(() => {})
  }, [st?.connected])

  const [draft, setDraft] = useState<ShippingConfig>(s.shipping)
  useEffect(() => { if (st?.settings) setDraft((d) => ({ ...d, ...st.settings })) }, [st?.settings])
  const up = (patch: Partial<ShippingConfig>) => setDraft((d) => ({ ...d, ...patch }))
  const num = (k: 'height' | 'width' | 'length' | 'weight') => ({
    type: 'number', min: 0, step: k === 'weight' ? 0.01 : 1, value: draft[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => up({ [k]: Number(e.target.value) }),
  })
  const connection = real ? (st?.expired ? 'expirado' : st?.connected ? 'conectado' : 'desconectado') : s.shipping.demoConnection
  const badge = STATE[connection]

  const save = async () => {
    if (draft.originCep && draft.originCep.length !== 8) { toast('Informe um CEP com 8 dígitos'); return }
    if (real) {
      const { demoConnection: _, ...body } = draft
      const numeric = body.services.filter((x) => /^\d+$/.test(x))
      const r = await fetch('/api/melhorenvio/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, services: numeric }) })
      toast(r.ok ? 'Configuração salva' : 'Não foi possível salvar')
      return
    }
    demo.setShippingConfig(draft)
    toast('Configuração salva na demonstração')
  }

  return (
    <>
      <header className="app-top">
        <div>
          <p>Configurações › Entregas</p>
          <h1>Melhor Envio</h1>
        </div>
        <Pill tone={badge.tone}>{badge.label}</Pill>
      </header>
      {!real && <div className="demo-note"><span className="ship-demo">DEMO</span> Sem credenciais neste ambiente: conexão, serviços e etiquetas abaixo são simulados. Nada é enviado ao Melhor Envio.</div>}

      <div className="cols">
        <div>
          <section className="panel">
            <h2>Regra de frete</h2>
            <div className="opts" style={{ marginTop: 0 }}>
              <label className={draft.mode === 'fixo' ? 'on' : ''}><input type="radio" name="modo" checked={draft.mode === 'fixo'} onChange={() => up({ mode: 'fixo' })} /><div><b>Frete fixo</b><span>Regra atual da loja, R$ 40,00 para todo o Brasil</span></div></label>
              <label className={draft.mode === 'calculado' ? 'on' : ''}><input type="radio" name="modo" checked={draft.mode === 'calculado'} onChange={() => up({ mode: 'calculado' })} /><div><b>Frete calculado por CEP</b><span>{real ? 'Cotações do Melhor Envio no checkout' : 'Na demonstração, usa modalidades simuladas'}</span></div></label>
            </div>
          </section>
          <section className="panel stack">
            <h2 style={{ marginBottom: 0 }}>Origem e embalagem</h2>
            <label className="field"><span>CEP de origem</span><input inputMode="numeric" value={formatCep(draft.originCep)} onChange={(e) => up({ originCep: onlyDigits(e.target.value) })} placeholder="00000-000" /></label>
            <div>
              <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Dimensões e peso por peça embalada. {real ? '' : 'Valores de exemplo: confirme com a loja.'}</p>
              <div className="dims">
                <label className="field"><span>Altura (cm)</span><input {...num('height')} /></label>
                <label className="field"><span>Largura (cm)</span><input {...num('width')} /></label>
                <label className="field"><span>Comprimento (cm)</span><input {...num('length')} /></label>
                <label className="field"><span>Peso (kg)</span><input {...num('weight')} /></label>
              </div>
            </div>
          </section>
          <section className="panel">
            <h2>Serviços de transporte</h2>
            <div className="stack" style={{ gap: 8 }}>
              {services.map((v) => (
                <label className="check" key={v.id}>
                  <input type="checkbox" checked={draft.services.includes(v.id)} onChange={(e) => up({ services: e.target.checked ? [...draft.services, v.id] : draft.services.filter((x) => x !== v.id) })} />
                  {v.company} · {v.name}
                </label>
              ))}
            </div>
          </section>
          <button className="btn" style={{ marginTop: 16 }} onClick={save}>Salvar configurações</button>
        </div>

        <section className="panel">
          <h2>Conexão</h2>
          {connection === 'conectado' && (
            <ul className="list-rows">
              <li><span>Conta<small>{real ? st?.account?.email ?? 'Dados indisponíveis' : 'Conta de demonstração'}</small></span><b>{real ? st?.account?.name || '—' : 'DEMO'}</b></li>
              {real && st?.expiresAt && <li><span>Token renova em</span><b>{fmtDate(st.expiresAt)}</b></li>}
              <li><span>Ambiente</span><b>{real ? st?.environment : 'Demonstração'}</b></li>
            </ul>
          )}
          {connection === 'expirado' && <p className="ship-err">A autorização expirou. Conecte novamente para voltar a cotar.</p>}

          {real ? (
            <div className="stack" style={{ marginTop: 12 }}>
              {!st?.admin ? (
                <form className="stack" onSubmit={async (e) => {
                  e.preventDefault()
                  const r = await fetch('/api/melhorenvio/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
                  setCode('')
                  if (r.ok) load(); else toast('Código inválido')
                }}>
                  <label className="field"><span>Código de administrador</span><input type="password" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} /></label>
                  <button className="btn btn-ghost">Entrar</button>
                </form>
              ) : connection === 'conectado' ? (
                <button className="btn btn-ghost" onClick={async () => { await fetch('/api/melhorenvio/disconnect', { method: 'POST' }); load(); toast('Integração desconectada') }}>Desconectar</button>
              ) : (
                <a className="btn" href="/api/melhorenvio/connect">{connection === 'expirado' ? 'Reconectar Melhor Envio' : 'Conectar Melhor Envio'}</a>
              )}
            </div>
          ) : (
            <div className="stack" style={{ marginTop: 12 }}>
              {connection === 'conectado' ? (
                <>
                  <button className="btn btn-ghost" onClick={() => { demo.setShippingConfig({ demoConnection: 'desconectado' }); toast('Desconectado (simulação)') }}>Desconectar</button>
                  <button className="text-btn" onClick={() => demo.setShippingConfig({ demoConnection: 'expirado' })}>Simular expiração da autorização</button>
                </>
              ) : (
                <button className="btn" onClick={() => { demo.setShippingConfig({ demoConnection: 'conectado' }); toast('Conexão simulada. Nenhuma conta real foi acessada.') }}>Conectar Melhor Envio</button>
              )}
              <p className="muted" style={{ fontSize: 13 }}>Este botão simula a conexão. A autorização real usa o fluxo OAuth do Melhor Envio.</p>
              {!!st?.missing?.length && (
                <div>
                  <p className="muted" style={{ fontSize: 13, marginBottom: 6 }}>Para ativar a conexão real, configure no servidor:</p>
                  <ul className="list-rows">{st.missing.map((m) => <li key={m}><small>{m}</small></li>)}</ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
