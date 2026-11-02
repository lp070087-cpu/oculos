export type OrderStatus = 'novo' | 'separacao' | 'enviado' | 'entregue' | 'cancelado'
export type PaymentStatus = 'pendente' | 'pago' | 'recusado'

export type ShippingOption = {
  id: string
  company: string
  service: string
  price: number
  deadline: string
  source: 'fixo' | 'retirada' | 'demo' | 'melhorenvio'
}

export type ShipmentStatus = 'aguardando' | 'preparado' | 'etiqueta' | 'postado' | 'entregue'
export type Shipment = { status: ShipmentStatus; label?: string; simulated: boolean }

export type ShippingConfig = {
  mode: 'fixo' | 'calculado'
  originCep: string
  height: number
  width: number
  length: number
  weight: number
  services: string[]
  demoConnection: 'desconectado' | 'conectado' | 'expirado'
}

export type OrderItem = { slug: string; name: string; image: string; qty: number; price: number }
export type OrderEvent = { at: number; text: string }

export type Order = {
  id: string
  createdAt: number
  customerId: string
  customerName: string
  phone: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  coupon?: string
  delivery: 'entrega' | 'retirada'
  address?: string
  destCep?: string
  shippingOption?: ShippingOption
  shipment?: Shipment
  payment: 'pix' | 'cartao' | 'whatsapp'
  paymentStatus: PaymentStatus
  status: OrderStatus
  tracking?: string
  history: OrderEvent[]
  source: 'site' | 'seed'
}

export type Address = { id: string; label: string; line: string; city: string; zip: string }

export type Customer = {
  id: string
  name: string
  business: string
  email: string
  phone: string
  city: string
  segment: 'Novo' | 'Recorrente' | 'VIP' | 'Inativo'
  notes: string
  marketingConsent: boolean
  /** Registro de consentimento (LGPD): quando autorizou e quando pediu para sair. */
  consentAt?: number
  optOutAt?: number
  addresses: Address[]
  createdAt: number
}

export type CartLine = { slug: string; name: string; variant: string; image: string; qty: number; price: number }
export type RecoveryResult = 'preparada' | 'simulada' | 'enviada' | 'falhou'
export type RecoveryAttempt = { id: string; at: number; channel: 'whatsapp'; mode: 'livre' | 'modelo'; text: string; result: RecoveryResult; note: string }

/** Carrinho acompanhado para recuperação. O status (ativo, abandonado, recuperado...) é calculado, não guardado. */
export type TrackedCart = {
  id: string
  customerId?: string
  lines: CartLine[]
  total: number
  createdAt: number
  lastActivity: number
  /** Primeiro momento em que passou do tempo de inatividade. Fica gravado mesmo se o cliente voltar. */
  abandonedAt?: number
  orderId?: string
  convertedAt?: number
  /** Token aleatório do link de retomada. Não carrega dado pessoal. */
  resumeToken: string
  attempts: RecoveryAttempt[]
}

export type Author = 'cliente' | 'atendente' | 'ia' | 'sistema'
export type Message = { id: string; from: Author; text: string; at: number }

export type Conversation = {
  id: string
  customerId?: string
  name: string
  phone: string
  tags: string[]
  mode: 'ia' | 'humano'
  unread: number
  messages: Message[]
  assignee?: string
}

export type Coupon = { code: string; kind: 'percent' | 'fixed'; value: number; active: boolean; uses: number; note: string }

export type Campaign = {
  id: string
  name: string
  channel: 'template' | 'link'
  audience: string
  recipients: number
  message: string
  status: 'rascunho' | 'simulada'
  createdAt: number
  couponCode?: string
}

export type AutoReply = { id: string; trigger: string; reply: string; active: boolean }
export type Notice = { id: string; title: string; body: string; at: number; read: boolean; href?: string }
export type Activity = { id: string; text: string; at: number; kind: 'pedido' | 'estoque' | 'cliente' | 'whatsapp' | 'marketing' }
export type ProductPatch = { name?: string; price?: number; oldPrice?: number | null; categoryId?: string; hidden?: boolean; image?: string }
export type NewProduct = { slug: string; name: string; categoryId: string; price: number; image: string }

export type DemoState = {
  version: number
  cart: { slug: string; qty: number }[]
  savedCart: { slug: string; qty: number }[]
  favorites: string[]
  sessionCustomerId: string | null
  couponApplied: string | null
  orders: Order[]
  customers: Customer[]
  conversations: Conversation[]
  coupons: Coupon[]
  campaigns: Campaign[]
  autoReplies: AutoReply[]
  notices: Notice[]
  activity: Activity[]
  stock: Record<string, number>
  patches: Record<string, ProductPatch>
  created: NewProduct[]
  whatsapp: { step: 0 | 1 | 2 | 3 }
  shipping: ShippingConfig
  lowStockAt: number
  /** Meta diária de faturamento, usada só para colorir os gráficos. */
  salesGoal: number
  carts: TrackedCart[]
  /** Carrinho acompanhado desta sessão do navegador. */
  cartId: string | null
  recovery: { idleMinutes: number }
}
