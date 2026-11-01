import { PRODUCTS, bySlug, imgUrl } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import type { Conversation, Customer, DemoState, Order, OrderItem } from './types'

/** Todos os clientes, pedidos, estoques e conversas abaixo são FICTÍCIOS. */
const BASE = Date.UTC(2026, 9, 31, 15, 0, 0)
const H = 3_600_000
const D = 24 * H

const customer = (id: string, name: string, business: string, city: string, segment: Customer['segment'], days: number, consent = true, notes = ''): Customer => ({
  id, name, business, city, segment, notes, marketingConsent: consent,
  email: `${id}@exemplo.test`,
  phone: `(11) 90000-${id.slice(-2).padStart(4, '0')}`,
  addresses: [{ id: `${id}-a`, label: 'Loja', line: 'Rua Exemplo, 100', city, zip: '00000-000' }],
  createdAt: BASE - days * D,
})

const customers: Customer[] = [
  customer('demo-01', 'Marina Exemplo', 'Ótica Exemplo Centro', 'São Paulo - SP', 'VIP', 210, true, 'Prefere lentes espelhadas. Compra a cada 3 semanas.'),
  customer('demo-02', 'Caio Fictício', 'Banca do Caio (demo)', 'Natal - RN', 'Recorrente', 150, true, 'Revende em feira aos sábados.'),
  customer('demo-03', 'Bia Modelo', 'Bia Acessórios (demo)', 'Rio de Janeiro - RJ', 'Recorrente', 120),
  customer('demo-04', 'Théo Teste', 'Teste Street Store', 'Recife - PE', 'Novo', 12),
  customer('demo-05', 'Lia Simulada', 'Quiosque Simulado', 'Salvador - BA', 'Novo', 6),
  customer('demo-06', 'Davi Amostra', 'Amostra Moda Urbana', 'Campinas - SP', 'VIP', 300, true, 'Pedidos grandes em Flack 2.0.'),
  customer('demo-07', 'Nina Protótipo', 'Protótipo Multimarcas', 'Belo Horizonte - MG', 'Inativo', 280, false, 'Sem consentimento de marketing.'),
]

const item = (slug: string, qty: number): OrderItem => {
  const p = bySlug(slug) ?? PRODUCTS[0]
  return { slug: p.slug, name: p.name, image: imgUrl(p.image), qty, price: p.price }
}

const P = PRODUCTS.filter((p) => !p.soldOut).map((p) => p.slug)

function order(n: number, c: Customer, hoursAgo: number, picks: [number, number][], status: Order['status'], pay: Order['paymentStatus']): Order {
  const items = picks.map(([i, q]) => item(P[i % P.length], q))
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const createdAt = BASE - hoursAgo * H
  return {
    id: `DEMO-${1000 + n}`, createdAt, customerId: c.id, customerName: c.name, phone: c.phone, items,
    subtotal, discount: 0, shipping: STORE.shipping, total: subtotal + STORE.shipping,
    delivery: 'entrega', address: `${c.addresses[0].line} · ${c.city}`, payment: n % 3 ? 'pix' : 'whatsapp',
    paymentStatus: pay, status, source: 'seed',
    tracking: status === 'enviado' || status === 'entregue' ? `DEMO${700000 + n}BR` : undefined,
    history: [{ at: createdAt, text: 'Pedido recebido' }],
  }
}

const [a, b, c, d, e, f] = customers

const orders: Order[] = [
  order(14, b, 3, [[0, 4], [11, 2]], 'novo', 'pendente'),
  order(13, d, 7, [[32, 6]], 'separacao', 'pago'),
  order(12, a, 20, [[4, 3], [5, 3], [14, 6]], 'separacao', 'pago'),
  order(11, f, 30, [[33, 6], [36, 6], [38, 6]], 'enviado', 'pago'),
  order(10, c, 52, [[2, 6]], 'enviado', 'pago'),
  order(9, a, 74, [[7, 6], [9, 6]], 'entregue', 'pago'),
  order(8, e, 98, [[1, 3], [3, 3]], 'entregue', 'pago'),
  order(7, f, 130, [[34, 12]], 'entregue', 'pago'),
  order(6, b, 170, [[12, 6]], 'entregue', 'pago'),
  order(5, c, 220, [[15, 3], [16, 3]], 'entregue', 'pago'),
  order(4, a, 290, [[18, 6], [20, 6]], 'entregue', 'pago'),
  order(3, f, 340, [[35, 12], [37, 6]], 'entregue', 'pago'),
  order(2, b, 480, [[0, 6]], 'entregue', 'pago'),
  order(1, c, 620, [[22, 6]], 'cancelado', 'recusado'),
]

const msg = (id: string, from: 'cliente' | 'atendente' | 'ia' | 'sistema', text: string, hoursAgo: number) => ({ id, from, text, at: BASE - hoursAgo * H })

const conversations: Conversation[] = [
  {
    id: 'c-demo-02', customerId: 'demo-02', name: 'Caio Fictício', phone: b.phone, tags: ['Pedido aberto'], mode: 'ia', unread: 1,
    messages: [msg('m1', 'cliente', 'Bom dia! Meu pedido já foi separado?', 1)],
  },
  {
    id: 'c-demo-06', customerId: 'demo-06', name: 'Davi Amostra', phone: f.phone, tags: ['VIP', 'Atacado'], mode: 'humano', unread: 0, assignee: 'Atendente demo',
    messages: [msg('m2', 'cliente', 'Tem Flack 2.0 preta lente ruby para mais 12 peças?', 6), msg('m3', 'atendente', 'Vou conferir o estoque e já te retorno.', 5.5)],
  },
  {
    id: 'c-lead-1', name: 'Contato novo (demo)', phone: '(11) 90000-0091', tags: ['Lead'], mode: 'ia', unread: 2,
    messages: [msg('m4', 'cliente', 'Oi, qual o mínimo para comprar?', 2), msg('m5', 'cliente', 'E o frete para Natal?', 1.9)],
  },
  {
    id: 'c-demo-04', customerId: 'demo-04', name: 'Théo Teste', phone: d.phone, tags: ['Carrinho abandonado'], mode: 'ia', unread: 0,
    messages: [msg('m6', 'sistema', 'Carrinho abandonado detectado: 4 peças. Faltam 2 para o mínimo. Contato autorizado.', 26)],
  },
]

export const seedStock = () =>
  Object.fromEntries(PRODUCTS.map((p, i) => [p.slug, p.soldOut ? 0 : [38, 24, 12, 60, 4, 18, 9, 31, 3, 44, 15, 27][i % 12]]))

export const seed = (): DemoState => ({
  version: 1,
  cart: [],
  savedCart: [{ slug: P[10], qty: 3 }, { slug: P[33], qty: 3 }],
  favorites: [],
  sessionCustomerId: null,
  couponApplied: null,
  orders,
  customers,
  conversations,
  coupons: [
    { code: 'DEMO10', kind: 'percent', value: 10, active: true, uses: 4, note: 'Cupom fictício da demonstração' },
    { code: 'PRIMEIRA20', kind: 'fixed', value: 20, active: true, uses: 2, note: 'Primeira compra · fictício' },
  ],
  campaigns: [
    { id: 'camp-1', name: 'Flack 2.0 na promoção', channel: 'template', audience: 'Recorrentes com consentimento', recipients: 2, message: 'Flack 2.0 com preço promocional. Pedido mínimo de 6 peças, pode mesclar modelos.', status: 'simulada', createdAt: BASE - 96 * H },
  ],
  autoReplies: [
    { id: 'r1', trigger: 'Primeira mensagem', reply: 'Olá! Aqui é a Oliveira OKL. Atacado a partir de 6 peças, pode mesclar modelos. Como posso ajudar?', active: true },
    { id: 'r2', trigger: 'Fora do horário', reply: 'Recebemos sua mensagem e retornamos no próximo horário de atendimento.', active: false },
    { id: 'r3', trigger: 'Pergunta sobre frete', reply: `Frete fixo de R$ ${STORE.shipping},00 para todo o Brasil.`, active: true },
  ],
  notices: [
    { id: 'n1', title: 'Pedido DEMO-1012 em separação', body: 'Atualização fictícia de demonstração.', at: BASE - 8 * H, read: false, href: '/conta/pedidos' },
    { id: 'n2', title: 'Cupom DEMO10 disponível', body: '10% de desconto no próximo pedido de teste.', at: BASE - 30 * H, read: true, href: '/conta/cupons' },
  ],
  activity: [
    { id: 'a1', text: 'Pedido DEMO-1014 recebido de Caio Fictício', at: BASE - 3 * H, kind: 'pedido' },
    { id: 'a2', text: 'Estoque baixo em 3 produtos', at: BASE - 5 * H, kind: 'estoque' },
    { id: 'a3', text: 'Novo cadastro: Lia Simulada', at: BASE - 28 * H, kind: 'cliente' },
    { id: 'a4', text: 'Campanha “Flack 2.0 na promoção” simulada', at: BASE - 96 * H, kind: 'marketing' },
  ],
  stock: seedStock(),
  patches: {},
  created: [],
  whatsapp: { step: 0 },
  lowStockAt: 5,
})
