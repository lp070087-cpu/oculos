'use client'

import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { PRODUCTS, bySlug, imgUrl, type Product } from '@/lib/catalog'
import { APP_MODE, STORE } from '@/lib/store-facts'
import { toast } from '@/lib/ui'
import { abandonedAt, newToken } from '@/lib/recovery'
import { seed } from './seed'
import type { Campaign, CartLine, Conversation, Coupon, Customer, DemoState, Order, OrderStatus, PaymentStatus, ProductPatch, RecoveryAttempt, ShippingConfig, ShippingOption, TrackedCart } from './types'

/**
 * Repositório local da demonstração: localStorage + BroadcastChannel.
 * Abas abertas ao mesmo tempo (loja e painel) recebem as mudanças na hora.
 * Em produção estas ações viram chamadas à API sobre Neon PostgreSQL (ver db/schema.sql).
 */
const KEY = 'okl-demo-v1'
const initial = seed()
let state: DemoState = initial
let hydrated = false
const listeners = new Set<() => void>()
let channel: BroadcastChannel | null = null

const emit = () => listeners.forEach((l) => l())

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      // Campos novos (meta, carrinhos acompanhados) entram com o valor inicial sem apagar o que já foi testado.
      if (parsed.version === initial.version) state = { ...initial, ...parsed }
    }
  } catch { /* armazenamento bloqueado: segue só em memória */ }
  try {
    channel = new BroadcastChannel(KEY)
    channel.onmessage = (e) => { state = e.data as DemoState; emit() }
  } catch { /* navegador sem BroadcastChannel */ }
  window.addEventListener('storage', (e) => {
    if (e.key === KEY && e.newValue) { state = JSON.parse(e.newValue); emit() }
  })
  emit()
}

function set(fn: (s: DemoState) => Partial<DemoState>) {
  state = { ...state, ...fn(state) }
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* idem */ }
  channel?.postMessage(state)
  emit()
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

/**
 * Acompanha o carrinho desta sessão a cada mudança. Se o cliente volta depois do tempo limite,
 * o abandono fica registrado: é isso que permite contar a recuperação quando o pedido sai.
 */
function track(s: DemoState, cart: DemoState['cart']): Pick<DemoState, 'cart' | 'carts' | 'cartId'> {
  const now = Date.now()
  const lines: CartLine[] = cart.flatMap((c) => {
    const p = findProduct(s, c.slug)
    return p ? [{ slug: c.slug, name: p.family, variant: p.variant, image: imgUrl(p.image), qty: c.qty, price: p.price }] : []
  })
  const total = lines.reduce((n, l) => n + l.qty * l.price, 0)
  const cur = s.carts.find((c) => c.id === s.cartId && !c.orderId)
  if (!cur) {
    if (!lines.length) return { cart, carts: s.carts, cartId: s.cartId }
    const fresh: TrackedCart = { id: uid('car'), customerId: s.sessionCustomerId ?? undefined, lines, total, createdAt: now, lastActivity: now, resumeToken: newToken(), attempts: [] }
    return { cart, carts: [fresh, ...s.carts], cartId: fresh.id }
  }
  const next = { ...cur, lines, total, lastActivity: now, customerId: cur.customerId ?? s.sessionCustomerId ?? undefined, abandonedAt: abandonedAt(cur, now, s.recovery.idleMinutes) }
  return { cart, carts: s.carts.map((c) => (c.id === cur.id ? next : c)), cartId: cur.id }
}

/** Ao entrar ou se cadastrar, o carrinho aberto da sessão passa a ser do cliente. */
const attach = (s: DemoState, customerId: string) => s.carts.map((c) => (c.id === s.cartId && !c.orderId && !c.customerId ? { ...c, customerId } : c))

/** Em produção o carrinho também vai para o servidor, para acompanhar entre dispositivos. Na demo não sai nada. */
let syncTimer: ReturnType<typeof setTimeout> | undefined
function syncCart() {
  if (APP_MODE !== 'production') return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const c = state.carts.find((x) => x.id === state.cartId)
    if (!c) return
    fetch('/api/carrinhos/registrar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
      body: JSON.stringify({ token: c.resumeToken, items: c.lines.map((l) => ({ slug: l.slug, qty: l.qty })) }),
    }).catch(() => {})
  }, 1500)
}

export function useDemo<T = DemoState>(selector?: (s: DemoState) => T): T {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => state,
    () => initial,
  )
  useEffect(hydrate, [])
  return (selector ? selector(s) : s) as T
}

/** true depois que os dados locais foram carregados no navegador. */
export function useHydrated() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l) },
    () => hydrated,
    () => false,
  )
}

export function catalog(s: DemoState): Product[] {
  const base = PRODUCTS.map((p) => {
    const patch = s.patches[p.slug]
    if (!patch) return p
    return { ...p, ...patch, oldPrice: patch.oldPrice === null ? undefined : patch.oldPrice ?? p.oldPrice } as Product & ProductPatch
  })
  const created: Product[] = s.created.map((c) => ({ ...c, family: c.name, variant: 'Novo', swatch: '#d9b441' }))
  return [...created, ...base].filter((p) => !(p as ProductPatch).hidden)
}

export const findProduct = (s: DemoState, slug: string) => catalog(s).find((p) => p.slug === slug) ?? bySlug(slug)

/** Versões do mesmo modelo: cada cor é um produto do catálogo. */
export function useFamily(family: string) {
  const patches = useDemo((s) => s.patches)
  const created = useDemo((s) => s.created)
  return useMemo(() => catalog({ patches, created } as DemoState).filter((p) => p.family === family), [patches, created, family])
}

/** Adiciona sem sair da página. Quem chama não abre o carrinho. */
export function addAndConfirm(slug: string, qty = 1) {
  const before = state.cart.find((c) => c.slug === slug)?.qty ?? 0
  demo.addToCart(slug, qty)
  const after = state.cart.find((c) => c.slug === slug)?.qty ?? 0
  toast(after > before ? 'Produto adicionado' : 'Limite do estoque atingido')
}

export function cartSummary(s: DemoState) {
  const lines = s.cart.flatMap((c) => {
    const product = findProduct(s, c.slug)
    return product ? [{ ...c, product }] : []
  })
  const pieces = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0)
  const coupon = s.coupons.find((c) => c.code === s.couponApplied && c.active)
  const discount = coupon ? (coupon.kind === 'percent' ? subtotal * (coupon.value / 100) : Math.min(coupon.value, subtotal)) : 0
  return { lines, pieces, subtotal, coupon, discount, missing: Math.max(0, STORE.minPieces - pieces) }
}

export const me = (s: DemoState) => s.customers.find((c) => c.id === s.sessionCustomerId) ?? null

const CHECKOUT_LOG: Record<OrderStatus, string> = {
  novo: 'Pedido recebido', separacao: 'Separação iniciada', enviado: 'Pedido enviado', entregue: 'Pedido entregue', cancelado: 'Pedido cancelado',
}

function appendMessage(conv: Conversation, from: Conversation['messages'][number]['from'], text: string): Conversation {
  return { ...conv, messages: [...conv.messages, { id: uid('m'), from, text, at: Date.now() }], unread: from === 'cliente' ? conv.unread + 1 : 0 }
}

export const demo = {
  reset() { const fresh = seed(); set(() => fresh) },

  addToCart(slug: string, qty = 1) {
    set((s) => {
      const limit = s.stock[slug] ?? 0
      const exists = s.cart.find((c) => c.slug === slug)
      const cart = exists
        ? s.cart.map((c) => (c.slug === slug ? { ...c, qty: Math.min(limit, c.qty + qty) } : c))
        : [...s.cart, { slug, qty: Math.min(limit, qty) }]
      return track(s, cart)
    })
    syncCart()
  },
  setQty(slug: string, qty: number) {
    set((s) => track(s, qty <= 0 ? s.cart.filter((c) => c.slug !== slug) : s.cart.map((c) => (c.slug === slug ? { ...c, qty: Math.min(s.stock[slug] ?? qty, qty) } : c))))
    syncCart()
  },
  saveCart() { set((s) => ({ savedCart: s.cart, ...track(s, []) })) },
  restoreCart() {
    set((s) => {
      const merged = [...s.cart]
      s.savedCart.forEach((l) => {
        const i = merged.findIndex((m) => m.slug === l.slug)
        if (i >= 0) merged[i] = { ...merged[i], qty: merged[i].qty + l.qty }
        else merged.push(l)
      })
      return { ...track(s, merged), savedCart: [] }
    })
  },
  /** Link de retomada: devolve ao carrinho os itens ainda em estoque e segue acompanhando o mesmo carrinho. */
  resumeCart(token: string) {
    const c = state.carts.find((x) => x.resumeToken === token)
    if (!c || c.orderId) return false
    set((s) => {
      const cart = c.lines.flatMap((l) => {
        const qty = Math.min(l.qty, s.stock[l.slug] ?? 0)
        return qty > 0 ? [{ slug: l.slug, qty }] : []
      })
      return track({ ...s, cartId: c.id }, cart)
    })
    return true
  },
  toggleFavorite(slug: string) {
    set((s) => ({ favorites: s.favorites.includes(slug) ? s.favorites.filter((f) => f !== slug) : [...s.favorites, slug] }))
  },
  applyCoupon(code: string) {
    const c = state.coupons.find((x) => x.code === code.trim().toUpperCase() && x.active)
    set(() => ({ couponApplied: c?.code ?? null }))
    return !!c
  },

  login(email: string) {
    const c = state.customers.find((x) => x.email.toLowerCase() === email.trim().toLowerCase()) ?? state.customers[0]
    set((s) => ({ sessionCustomerId: c.id, carts: attach(s, c.id) }))
    return c
  },
  register(data: Pick<Customer, 'name' | 'business' | 'email' | 'phone' | 'city' | 'marketingConsent'>) {
    const id = uid('cli')
    const customer: Customer = { ...data, id, segment: 'Novo', notes: '', addresses: [], createdAt: Date.now(), consentAt: data.marketingConsent ? Date.now() : undefined }
    set((s) => ({
      customers: [customer, ...s.customers],
      sessionCustomerId: id,
      carts: attach(s, id),
      activity: [{ id: uid('a'), text: `Novo cadastro: ${data.name}`, at: Date.now(), kind: 'cliente' as const }, ...s.activity],
    }))
    return customer
  },
  logout() { set(() => ({ sessionCustomerId: null })) },
  updateCustomer(id: string, patch: Partial<Customer>) {
    set((s) => ({
      customers: s.customers.map((c) => {
        if (c.id !== id) return c
        const changed = patch.marketingConsent !== undefined && patch.marketingConsent !== c.marketingConsent
        const log = changed ? (patch.marketingConsent ? { consentAt: Date.now() } : { optOutAt: Date.now() }) : {}
        return { ...c, ...patch, ...log }
      }),
    }))
  },
  /** Descadastro (ex.: cliente respondeu SAIR). Bloqueia novos contatos e fica registrado. */
  optOut(id: string) {
    const c = state.customers.find((x) => x.id === id)
    if (!c) return
    set((s) => ({
      customers: s.customers.map((x) => (x.id === id ? { ...x, marketingConsent: false, optOutAt: Date.now() } : x)),
      activity: [{ id: uid('a'), text: `${c.name} pediu para não receber mensagens`, at: Date.now(), kind: 'marketing' as const }, ...s.activity],
    }))
  },

  placeOrder(input: { name: string; business?: string; email: string; phone: string; city: string; delivery: 'entrega' | 'retirada'; address?: string; destCep?: string; shippingOption: ShippingOption; payment: Order['payment'] }) {
    const s0 = state
    const sum = cartSummary(s0)
    const shipping = input.shippingOption.price
    const number = s0.orders.reduce((m, o) => Math.max(m, Number(o.id.split('-')[1]) || 0), 1000) + 1
    const now = Date.now()
    let customer = me(s0) ?? s0.customers.find((c) => c.email === input.email)
    const isNew = !customer
    if (!customer) {
      customer = { id: uid('cli'), name: input.name, business: input.business ?? '', email: input.email, phone: input.phone, city: input.city, segment: 'Novo', notes: '', marketingConsent: false, addresses: [], createdAt: now }
    }
    const order: Order = {
      id: `DEMO-${number}`, createdAt: now, customerId: customer.id, customerName: input.name, phone: input.phone,
      items: sum.lines.map((l) => ({ slug: l.slug, name: l.product.name, image: l.product.image.startsWith('/') ? l.product.image : imgUrl(l.product.image), qty: l.qty, price: l.product.price })),
      subtotal: sum.subtotal, discount: sum.discount, shipping, total: sum.subtotal - sum.discount + shipping,
      coupon: sum.coupon?.code, delivery: input.delivery, address: input.address, destCep: input.destCep, shippingOption: input.shippingOption,
      shipment: { status: 'aguardando', simulated: true }, payment: input.payment,
      paymentStatus: input.payment === 'whatsapp' ? 'pendente' : 'pago', status: 'novo', source: 'site',
      history: [{ at: now, text: 'Pedido de teste recebido pelo site' }],
    }
    const stock = { ...s0.stock }
    sum.lines.forEach((l) => { stock[l.slug] = Math.max(0, (stock[l.slug] ?? 0) - l.qty) })
    const hasConv = s0.conversations.find((c) => c.customerId === customer!.id)
    const confirm = `Pedido ${order.id} confirmado na demonstração. ${sum.pieces} peças.`
    const conversations = hasConv
      ? s0.conversations.map((c) => (c.id === hasConv.id ? appendMessage(c, 'sistema', confirm) : c))
      : [{ id: `c-${customer.id}`, customerId: customer.id, name: input.name, phone: input.phone, tags: ['Pedido aberto'], mode: 'ia' as const, unread: 0, messages: [{ id: uid('m'), from: 'sistema' as const, text: confirm, at: now }] }, ...s0.conversations]
    // O carrinho acompanhado vira pedido. Se tinha passado do tempo limite antes disso, conta como recuperado.
    const carts = s0.carts.map((c) => (c.id === s0.cartId && !c.orderId
      ? { ...c, customerId: customer!.id, orderId: order.id, convertedAt: now, abandonedAt: abandonedAt(c, now, s0.recovery.idleMinutes) }
      : c))
    set((s) => ({
      orders: [order, ...s.orders], cart: [], couponApplied: null, stock, conversations, carts, cartId: null,
      customers: isNew ? [customer!, ...s.customers] : s.customers,
      sessionCustomerId: s.sessionCustomerId ?? customer!.id,
      coupons: s.coupons.map((c) => (c.code === order.coupon ? { ...c, uses: c.uses + 1 } : c)),
      notices: [{ id: uid('n'), title: `Pedido ${order.id} recebido`, body: 'Acompanhe o status em Meus pedidos.', at: now, read: false, href: `/conta/pedidos/${order.id}` }, ...s.notices],
      activity: [{ id: uid('a'), text: `Pedido ${order.id} recebido de ${input.name}`, at: now, kind: 'pedido' as const }, ...s.activity],
    }))
    return order
  },

  setOrderStatus(id: string, status: OrderStatus) {
    set((s) => {
      const o = s.orders.find((x) => x.id === id)
      if (!o) return {}
      const tracking = status === 'enviado' ? o.tracking ?? `DEMO${String(Date.now()).slice(-6)}BR` : o.tracking
      return {
        orders: s.orders.map((x) => (x.id === id ? { ...x, status, tracking, history: [...x.history, { at: Date.now(), text: CHECKOUT_LOG[status] }] } : x)),
        notices: [{ id: uid('n'), title: `Pedido ${id}: ${CHECKOUT_LOG[status].toLowerCase()}`, body: 'Atualização da demonstração.', at: Date.now(), read: false, href: `/conta/pedidos/${id}` }, ...s.notices],
      }
    })
  },
  prepareShipment(id: string) {
    set((s) => ({ orders: s.orders.map((x) => (x.id === id ? { ...x, shipment: { status: 'preparado' as const, simulated: true }, history: [...x.history, { at: Date.now(), text: 'Envio preparado (demonstração)' }] } : x)) }))
  },
  /** Nunca chama a API: na demonstração não há compra de frete nem uso de saldo. */
  generateDemoLabel(id: string) {
    set((s) => ({
      orders: s.orders.map((x) => {
        if (x.id !== id) return x
        const label = `DEMO${String(Date.now()).slice(-8)}`
        return { ...x, tracking: label, shipment: { status: 'etiqueta' as const, label, simulated: true }, history: [...x.history, { at: Date.now(), text: `Etiqueta simulada ${label}, sem cobrança` }] }
      }),
    }))
  },
  setShippingConfig(patch: Partial<ShippingConfig>) { set((s) => ({ shipping: { ...s.shipping, ...patch } })) },
  setPaymentStatus(id: string, paymentStatus: PaymentStatus) {
    set((s) => ({ orders: s.orders.map((x) => (x.id === id ? { ...x, paymentStatus, history: [...x.history, { at: Date.now(), text: `Pagamento marcado como ${paymentStatus}` }] } : x)) }))
  },

  markNoticesRead() { set((s) => ({ notices: s.notices.map((n) => ({ ...n, read: true })) })) },

  patchProduct(slug: string, patch: ProductPatch) { set((s) => ({ patches: { ...s.patches, [slug]: { ...s.patches[slug], ...patch } } })) },
  setStock(slug: string, qty: number) {
    set((s) => ({ stock: { ...s.stock, [slug]: Math.max(0, qty) }, activity: [{ id: uid('a'), text: `Estoque ajustado: ${bySlug(slug)?.name ?? slug} → ${qty}`, at: Date.now(), kind: 'estoque' as const }, ...s.activity] }))
  },
  createProduct(p: { name: string; categoryId: string; price: number; image: string; stock: number }) {
    const slug = uid('novo')
    set((s) => ({ created: [{ slug, name: p.name, categoryId: p.categoryId, price: p.price, image: p.image }, ...s.created], stock: { ...s.stock, [slug]: p.stock } }))
  },

  saveCoupon(c: Coupon) { set((s) => ({ coupons: [c, ...s.coupons.filter((x) => x.code !== c.code)] })) },
  toggleCoupon(code: string) { set((s) => ({ coupons: s.coupons.map((c) => (c.code === code ? { ...c, active: !c.active } : c)) })) },
  saveCampaign(c: Omit<Campaign, 'id' | 'createdAt'>) {
    set((s) => ({
      campaigns: [{ ...c, id: uid('camp'), createdAt: Date.now() }, ...s.campaigns],
      activity: [{ id: uid('a'), text: `Campanha “${c.name}” ${c.status === 'simulada' ? 'simulada (nada foi enviado)' : 'salva'}`, at: Date.now(), kind: 'marketing' as const }, ...s.activity],
    }))
  },

  setSalesGoal(v: number) { if (v > 0) set(() => ({ salesGoal: Math.round(v) })) },
  setIdleMinutes(m: number) { if (m >= 5) set(() => ({ recovery: { idleMinutes: Math.round(m) } })) },
  /**
   * Registra a tentativa no histórico do carrinho. Envio simulado também aparece na Central WhatsApp,
   * marcado como simulação. Nada sai do navegador.
   */
  recordAttempt(cartId: string, a: Omit<RecoveryAttempt, 'id' | 'at'>) {
    const cart = state.carts.find((c) => c.id === cartId)
    if (!cart) return
    const at = Date.now()
    const attempt: RecoveryAttempt = { ...a, id: uid('att'), at }
    const customer = state.customers.find((c) => c.id === cart.customerId)
    set((s) => {
      const carts = s.carts.map((c) => (c.id === cartId ? { ...c, attempts: [...c.attempts, attempt] } : c))
      if ((a.result !== 'simulada' && a.result !== 'enviada') || !customer) return { carts }
      const convId = s.conversations.find((c) => c.customerId === customer.id)?.id ?? `c-${customer.id}`
      const base: Conversation = s.conversations.find((c) => c.id === convId) ?? { id: convId, customerId: customer.id, name: customer.name, phone: customer.phone, tags: [], mode: 'humano', unread: 0, messages: [] }
      const note = a.result === 'simulada' ? `Recuperação de carrinho ${cartId}: envio simulado, nada saiu pelo WhatsApp` : `Recuperação de carrinho ${cartId}: enviado pela API oficial`
      const conv = { ...base, tags: base.tags.includes('Carrinho abandonado') ? base.tags : [...base.tags, 'Carrinho abandonado'], messages: [...base.messages, { id: uid('m'), from: 'sistema' as const, text: note, at }, { id: uid('m'), from: 'atendente' as const, text: a.text, at }] }
      return {
        carts,
        conversations: [conv, ...s.conversations.filter((c) => c.id !== convId)],
        activity: [{ id: uid('a'), text: `Carrinho de ${customer.name}: ${a.result === 'simulada' ? 'mensagem simulada' : 'mensagem enviada'}`, at, kind: 'whatsapp' as const }, ...s.activity],
      }
    })
  },

  setWhatsappStep(step: DemoState['whatsapp']['step']) { set(() => ({ whatsapp: { step } })) },
  toggleAutoReply(id: string) { set((s) => ({ autoReplies: s.autoReplies.map((r) => (r.id === id ? { ...r, active: !r.active } : r)) })) },
  updateAutoReply(id: string, reply: string) { set((s) => ({ autoReplies: s.autoReplies.map((r) => (r.id === id ? { ...r, reply } : r)) })) },
  updateConversation(id: string, patch: Partial<Conversation>) { set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...patch } : c)) })) },
  sendMessage(id: string, from: 'atendente' | 'ia', text: string) {
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? appendMessage(c, from, text) : c)) }))
  },
  /** Mensagem simulada do cliente: abre a conversa certa e sobe para o topo da caixa de entrada. */
  customerMessage(text: string) {
    const c = me(state)
    const name = c?.name ?? 'Visitante da loja (demo)'
    const convId = state.conversations.find((x) => (c ? x.customerId === c.id : x.id === 'c-visitante'))?.id ?? (c ? `c-${c.id}` : 'c-visitante')
    set((s) => {
      const existing = s.conversations.find((x) => x.id === convId)
      const updated = appendMessage(existing ?? { id: convId, customerId: c?.id, name, phone: c?.phone ?? '(00) 00000-0000', tags: [], mode: 'ia', unread: 0, messages: [] }, 'cliente', text)
      return {
        conversations: [updated, ...s.conversations.filter((x) => x.id !== convId)],
        activity: [{ id: uid('a'), text: `Nova mensagem de ${name}`, at: Date.now(), kind: 'whatsapp' as const }, ...s.activity],
      }
    })
    return convId
  },
  simulateIncoming(id: string, text: string) {
    set((s) => {
      const conv = s.conversations.find((c) => c.id === id)
      if (!conv) return {}
      return { conversations: [appendMessage(conv, 'cliente', text), ...s.conversations.filter((c) => c.id !== id)] }
    })
  },
}
