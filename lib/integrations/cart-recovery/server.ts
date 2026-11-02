import 'server-only'
import { createHash } from 'crypto'
import { bySlug } from '@/lib/catalog'
import { APP_MODE } from '@/lib/store-facts'
import { whatsapp } from '@/lib/integrations/whatsapp'
import { DEFAULT_IDLE_MINUTES, MAX_ATTEMPTS, MIN, waNumber } from '@/lib/recovery'

/**
 * Persistência e envio da recuperação de carrinhos (modo produção, Neon PostgreSQL).
 * Roda só no servidor: o token da Meta e os dados pessoais nunca vão para o navegador.
 */

export class RecoveryError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

const DAY = 24 * 60 * MIN
export const persistenceReady = () => !!process.env.DATABASE_URL
const idleMinutes = () => Number(process.env.CART_IDLE_MINUTES) || DEFAULT_IDLE_MINUTES

async function sql(text: string, params: unknown[] = []) {
  const { neon } = await import('@neondatabase/serverless')
  return neon(process.env.DATABASE_URL as string).query(text, params) as Promise<Record<string, unknown>[]>
}

/** O banco guarda só o hash do token do link de retomada. */
const hashToken = (t: string) => createHash('sha256').update(t).digest('hex')

/**
 * Registra ou atualiza o carrinho a cada mudança. Preço vem do catálogo do servidor.
 * O cliente é associado pela sessão autenticada, nunca por e-mail enviado pelo navegador.
 */
export async function registerCart(token: string, items: { slug: string; qty: number }[], customerId: string | null = null) {
  const lines = items.flatMap((i) => { const p = bySlug(i.slug); return p ? [{ slug: p.slug, qty: i.qty, cents: Math.round(p.price * 100) }] : [] })
  const total = lines.reduce((n, l) => n + l.qty * l.cents, 0)
  const rows = await sql(
    `insert into carts (resume_token_hash, customer_id, total_cents) values ($1, $2, $3)
     on conflict (resume_token_hash) do update set
       total_cents = excluded.total_cents,
       customer_id = coalesce(carts.customer_id, excluded.customer_id),
       abandoned_at = coalesce(carts.abandoned_at, case when now() - carts.last_activity_at >= make_interval(mins => $4) then carts.last_activity_at + make_interval(mins => $4) end),
       last_activity_at = now()
     where carts.order_id is null
     returning id`,
    [hashToken(token), customerId, total, idleMinutes()],
  )
  const id = rows[0]?.id
  if (!id) return { stored: false }
  await sql('delete from cart_items where cart_id = $1', [id])
  if (lines.length) {
    await sql(
      'insert into cart_items (cart_id, product_slug, qty, price_cents) select $1, * from unnest($2::text[], $3::int[], $4::int[])',
      [id, lines.map((l) => l.slug), lines.map((l) => l.qty), lines.map((l) => l.cents)],
    )
  }
  return { stored: true }
}

/** Chamado na criação do pedido. Só conta como recuperado se o carrinho passou do tempo limite antes. */
export async function convertCart(token: string, orderId: string) {
  await sql(
    `update carts set order_id = $2, converted_at = now(),
       abandoned_at = coalesce(abandoned_at, case when now() - last_activity_at >= make_interval(mins => $3) then last_activity_at + make_interval(mins => $3) end)
     where resume_token_hash = $1 and order_id is null`,
    [hashToken(token), orderId, idleMinutes()],
  )
}

/** Envio real: repete no servidor todas as checagens da tela e reserva a tentativa antes de chamar a Meta. */
export async function sendRecovery(token: string, text: string) {
  if (APP_MODE !== 'production') throw new RecoveryError('Envio real bloqueado no modo demonstração.', 403)
  const [c] = await sql(
    `select c.id, c.order_id, c.last_activity_at, cu.phone, cu.marketing_consent, cu.consent_at, cu.opt_out_at,
       (select count(*) from recovery_attempts a where a.cart_id = c.id and a.result = 'enviada')::int as sent,
       (select max(a.created_at) from recovery_attempts a where a.cart_id = c.id and a.result = 'enviada') as last_sent,
       (select max(m.at) from messages m join conversations v on v.id = m.conversation_id where v.customer_id = c.customer_id and m.author = 'cliente') as last_inbound
     from carts c left join customers cu on cu.id = c.customer_id where c.resume_token_hash = $1`,
    [hashToken(token)],
  )
  if (!c) throw new RecoveryError('Carrinho não encontrado.', 404)
  if (c.order_id) throw new RecoveryError('Carrinho já virou pedido.', 409)
  const now = Date.now()
  const ts = (v: unknown) => (v ? new Date(v as string).getTime() : 0)
  if (now - ts(c.last_activity_at) < idleMinutes() * MIN) throw new RecoveryError('Carrinho ainda ativo.', 409)
  const to = waNumber(c.phone as string | undefined)
  if (!to) throw new RecoveryError('Cliente sem WhatsApp válido.', 422)
  const optedOut = ts(c.opt_out_at) && ts(c.opt_out_at) >= ts(c.consent_at)
  if (!c.marketing_consent || optedOut) throw new RecoveryError('Cliente não autorizou mensagens.', 403)
  if (Number(c.sent) >= MAX_ATTEMPTS || now - ts(c.last_sent) < DAY) throw new RecoveryError('Limite de contatos para este carrinho.', 429)

  const open = now - ts(c.last_inbound) < DAY
  const template = process.env.WHATSAPP_TEMPLATE_RECOVERY
  if (!open && !template) throw new RecoveryError('Fora da janela de 24h e sem modelo aprovado configurado.', 409)

  // O índice único (um envio por carrinho por dia) segura cliques repetidos e duas abas ao mesmo tempo.
  const [slot] = await sql(
    `insert into recovery_attempts (cart_id, mode, template_name, body, result) values ($1, $2, $3, $4, 'enviando')
     on conflict do nothing returning id`,
    [c.id, open ? 'livre' : 'modelo', open ? null : template, text],
  )
  if (!slot) throw new RecoveryError('Já existe um envio em andamento ou feito hoje.', 429)
  const res = await whatsapp.send(open ? { to, text } : { to, templateName: template, params: [text] })
  await sql('update recovery_attempts set result = $2, provider_message_id = $3, error = $4 where id = $1', [slot.id, res.ok ? 'enviada' : 'falhou', res.id ?? null, res.error ?? null])
  if (!res.ok) throw new RecoveryError(res.error ?? 'Falha no envio.', 502)
  return { ok: true }
}

/** Descadastro pelo link: bloqueia novos contatos e grava no histórico de consentimento. */
export async function optOut(token: string) {
  const rows = await sql(
    `update customers set marketing_consent = false, opt_out_at = now()
     where id = (select customer_id from carts where resume_token_hash = $1) returning id`,
    [hashToken(token)],
  )
  if (rows[0]) await sql(`insert into consent_log (customer_id, channel, granted, source) values ($1, 'whatsapp', false, 'link de descadastro')`, [rows[0].id])
  return { ok: true }
}
