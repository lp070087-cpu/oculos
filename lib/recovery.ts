import type { Conversation, Customer, TrackedCart } from '@/lib/demo/types'

/** Regras de recuperação de carrinho. Puras: valem no navegador (demo) e no servidor (produção). */

export const MIN = 60_000
const DAY = 24 * 60 * MIN
export const DEFAULT_IDLE_MINUTES = 60
/** Nome do modelo que precisa estar aprovado na Meta para contato fora da janela de 24h. */
export const RECOVERY_TEMPLATE = 'recuperacao_carrinho'
export const MAX_ATTEMPTS = 2

export type CartStatus = 'ativo' | 'abandonado' | 'recuperado' | 'convertido'
export const STATUS_LABEL: Record<CartStatus, string> = { ativo: 'Ativo', abandonado: 'Abandonado', recuperado: 'Recuperado', convertido: 'Convertido' }

/** Momento do abandono: o gravado ou, se ainda parado, a última atividade somada ao tempo limite. */
export function abandonedAt(c: TrackedCart, now: number, idleMinutes: number) {
  if (c.abandonedAt) return c.abandonedAt
  if (c.orderId) return undefined
  const at = c.lastActivity + idleMinutes * MIN
  return now >= at ? at : undefined
}

/** Pedido fechado nunca conta como abandonado. Só vira "recuperado" se antes ficou parado além do limite. */
export function cartStatus(c: TrackedCart, now: number, idleMinutes: number): CartStatus {
  if (c.orderId) return c.abandonedAt ? 'recuperado' : 'convertido'
  return now - c.lastActivity >= idleMinutes * MIN ? 'abandonado' : 'ativo'
}

export type Consent = 'autorizado' | 'sem-autorizacao' | 'descadastrado' | 'anonimo'
export const CONSENT_LABEL: Record<Consent, string> = { autorizado: 'Autorizado', 'sem-autorizacao': 'Sem autorização', descadastrado: 'Descadastrado', anonimo: 'Anônimo' }

export function consentOf(c?: Customer | null): Consent {
  if (!c) return 'anonimo'
  if (c.optOutAt && (!c.consentAt || c.optOutAt >= c.consentAt)) return 'descadastrado'
  return c.marketingConsent ? 'autorizado' : 'sem-autorizacao'
}

/** Telefone brasileiro com DDD: 10 ou 11 dígitos, com ou sem 55. */
export function waNumber(phone?: string) {
  const d = (phone ?? '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  return /^[1-9]{2}9?\d{8}$/.test(d) ? `55${d}` : null
}

/** Janela de atendimento da Meta: 24h desde a última mensagem do cliente. */
export function windowOpen(conv: Conversation | undefined, now: number) {
  const last = conv?.messages.filter((m) => m.from === 'cliente').at(-1)
  return !!last && now - last.at < DAY
}

export type Check = { label: string; ok: boolean; detail: string }

/** Tudo que precisa ser verdade antes de qualquer contato. O servidor repete estas checagens no envio real. */
export function eligibility(cart: TrackedCart, customer: Customer | undefined, conv: Conversation | undefined, now: number, idleMinutes: number) {
  const status = cartStatus(cart, now, idleMinutes)
  const consent = consentOf(customer)
  const number = waNumber(customer?.phone)
  const sent = cart.attempts.filter((a) => a.result === 'simulada' || a.result === 'enviada')
  const recent = sent.some((a) => now - a.at < DAY)
  const open = windowOpen(conv, now)
  const checks: Check[] = [
    { label: 'Carrinho abandonado e sem pedido', ok: status === 'abandonado', detail: status === 'abandonado' ? 'Parado além do tempo limite' : `Status atual: ${STATUS_LABEL[status].toLowerCase()}` },
    { label: 'Cliente identificado com WhatsApp válido', ok: !!customer && !!number, detail: !customer ? 'Carrinho anônimo: entra só nas estatísticas' : number ? `+${number}` : 'Telefone ausente ou inválido' },
    { label: 'Autorização para mensagens', ok: consent === 'autorizado', detail: consent === 'autorizado' ? 'Consentimento registrado' : consent === 'descadastrado' ? 'Cliente pediu para não receber mensagens' : consent === 'anonimo' ? 'Sem contato autorizado' : 'Cliente não autorizou mensagens' },
    { label: 'Sem envio repetido', ok: !recent && sent.length < MAX_ATTEMPTS, detail: recent ? 'Já houve um envio nas últimas 24h' : sent.length >= MAX_ATTEMPTS ? `Limite de ${MAX_ATTEMPTS} contatos por carrinho` : `${sent.length} de ${MAX_ATTEMPTS} contatos usados` },
  ]
  return {
    ok: checks.every((c) => c.ok),
    checks,
    mode: (open ? 'livre' : 'modelo') as 'livre' | 'modelo',
    window: open ? 'Janela de 24h aberta: texto livre permitido' : `Fora da janela de 24h: só com o modelo aprovado “${RECOVERY_TEMPLATE}”`,
  }
}

export function suggestedMessage(name?: string, link?: string) {
  const hi = name ? `Olá, ${name.split(' ')[0]}! Tudo bem? 😊` : 'Olá! Tudo bem? 😊'
  return [
    `${hi} Vimos que você selecionou alguns modelos na Oliveira OKL, mas ainda não concluiu seu pedido. Se precisar de ajuda com os produtos ou com a entrega, estamos por aqui!`,
    link ? `\n\nRetome seu carrinho: ${link}` : '',
    '\n\nPara não receber mais mensagens, responda SAIR.',
  ].join('')
}

export const newToken = () => {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
