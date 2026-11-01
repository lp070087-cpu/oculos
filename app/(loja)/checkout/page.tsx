'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { brl, imgUrl } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import { cartSummary, demo, me, useDemo, useHydrated } from '@/lib/demo/store'
import { toast } from '@/lib/ui'
import type { Order } from '@/lib/demo/types'

const SAMPLE = { name: 'Comprador Demonstração', business: 'Loja Teste', email: 'comprador@exemplo.test', phone: '(11) 90000-0100', city: 'São Paulo - SP', address: 'Rua Exemplo, 100' }

export default function Checkout() {
  const s = useDemo()
  const ready = useHydrated()
  const router = useRouter()
  const sum = cartSummary(s)
  const user = me(s)
  const [form, setForm] = useState({ name: '', business: '', email: '', phone: '', city: '', address: '' })
  const [delivery, setDelivery] = useState<'entrega' | 'retirada'>('entrega')
  const [payment, setPayment] = useState<Order['payment']>('pix')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const value = { ...form, name: form.name || user?.name || '', business: form.business || user?.business || '', email: form.email || user?.email || '', phone: form.phone || user?.phone || '', city: form.city || user?.city || '', address: form.address || user?.addresses[0]?.line || '' }
  const up = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const shipping = delivery === 'entrega' ? STORE.shipping : 0
  const total = sum.subtotal - sum.discount + shipping

  if (!ready) return <div className="wrap page-pad" />
  if (!sum.lines.length && !busy) {
    return <div className="wrap empty page-pad"><h1>Seu pedido está vazio</h1><Link className="btn" href="/produtos">Ver coleção</Link></div>
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const missing = [!value.name && 'name', !value.email && 'email', !value.phone && 'phone', !value.city && 'city', delivery === 'entrega' && !value.address && 'address'].filter(Boolean) as string[]
    setErrors(missing)
    if (missing.length) { document.getElementById(`f-${missing[0]}`)?.focus(); return }
    setBusy(true)
    setTimeout(() => {
      const order = demo.placeOrder({ ...value, delivery, address: delivery === 'entrega' ? `${value.address} · ${value.city}` : undefined, payment })
      router.push(`/pedido/${order.id}`)
    }, 900)
  }

  const field = (k: keyof typeof form, label: string, type = 'text', auto?: string) => (
    <label className={`field ${errors.includes(k) ? 'bad' : ''}`}>
      <span>{label}</span>
      <input id={`f-${k}`} type={type} autoComplete={auto} value={value[k]} onChange={up(k)} aria-invalid={errors.includes(k)} />
      {errors.includes(k) && <small>Campo obrigatório</small>}
    </label>
  )

  return (
    <div className="wrap checkout">
      <header className="list-head">
        <span className="eyebrow">Pedido de teste</span>
        <h1>Finalizar</h1>
      </header>
      <form className="co-grid" onSubmit={submit} noValidate>
        <div className="co-main">
          <section>
            <div className="row-between"><h2><i>1</i> Seus dados</h2><button type="button" className="text-btn" onClick={() => { setForm(SAMPLE); setErrors([]) }}>Preencher com dados fictícios</button></div>
            <div className="form-grid">
              {field('name', 'Nome', 'text', 'name')}
              {field('business', 'Loja (opcional)', 'text', 'organization')}
              {field('email', 'E-mail', 'email', 'email')}
              {field('phone', 'WhatsApp', 'tel', 'tel')}
            </div>
          </section>
          <section>
            <h2><i>2</i> Entrega</h2>
            <div className="opts">
              <label className={delivery === 'entrega' ? 'on' : ''}><input type="radio" name="d" checked={delivery === 'entrega'} onChange={() => setDelivery('entrega')} /><div><b>Envio para todo o Brasil</b><span>Frete fixo</span></div><strong>{brl(STORE.shipping)}</strong></label>
              <label className={delivery === 'retirada' ? 'on' : ''}><input type="radio" name="d" checked={delivery === 'retirada'} onChange={() => setDelivery('retirada')} /><div><b>Retirada em São Paulo</b><span>Opção demonstrativa, regra a confirmar com a loja</span></div><strong>{brl(0)}</strong></label>
            </div>
            <div className="form-grid">
              {delivery === 'entrega' && field('address', 'Endereço', 'text', 'street-address')}
              {field('city', 'Cidade - UF', 'text', 'address-level2')}
            </div>
          </section>
          <section>
            <h2><i>3</i> Pagamento</h2>
            <div className="opts">
              <label className={payment === 'pix' ? 'on' : ''}><input type="radio" name="p" checked={payment === 'pix'} onChange={() => setPayment('pix')} /><div><b>Pix de teste</b><span>Simulado, nenhuma cobrança é gerada</span></div></label>
              <label className={payment === 'cartao' ? 'on' : ''}><input type="radio" name="p" checked={payment === 'cartao'} onChange={() => setPayment('cartao')} /><div><b>Cartão de teste</b><span>Demonstrativo, nenhum dado de cartão é solicitado</span></div></label>
              <label className={payment === 'whatsapp' ? 'on' : ''}><input type="radio" name="p" checked={payment === 'whatsapp'} onChange={() => setPayment('whatsapp')} /><div><b>Combinar pelo WhatsApp</b><span>Como a loja funciona hoje</span></div></label>
            </div>
          </section>
        </div>
        <aside className="co-side">
          <h2>{sum.pieces} peças</h2>
          <ul>
            {sum.lines.map((l) => (
              <li key={l.slug}><img src={imgUrl(l.product.image)} alt="" /><span>{l.qty} × {l.product.name}</span><b>{brl(l.qty * l.product.price)}</b></li>
            ))}
          </ul>
          <div className="co-coupon">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Cupom (ex.: DEMO10)" aria-label="Cupom" />
            <button type="button" className="btn btn-ghost" onClick={() => toast(demo.applyCoupon(code) ? 'Cupom aplicado' : 'Cupom inválido')}>Aplicar</button>
          </div>
          <div className="row-between"><span>Subtotal</span><span>{brl(sum.subtotal)}</span></div>
          {sum.discount > 0 && <div className="row-between gold-text"><span>Cupom {sum.coupon?.code}</span><span>-{brl(sum.discount)}</span></div>}
          <div className="row-between"><span>Frete</span><span>{brl(shipping)}</span></div>
          <div className="row-between co-total"><span>Total</span><b>{brl(total)}</b></div>
          {sum.missing > 0 && <p className="warn-text">Faltam {sum.missing} peças para o mínimo de {STORE.minPieces}.</p>}
          <button className="btn btn-block" disabled={busy || sum.missing > 0}>
            {busy ? <><Loader2 size={17} className="spin" aria-hidden /> Registrando</> : 'Confirmar pedido de teste'}
          </button>
          <p className="co-safe"><ShieldCheck size={15} aria-hidden /> Demonstração. Nada é cobrado ou enviado.</p>
        </aside>
      </form>
    </div>
  )
}
