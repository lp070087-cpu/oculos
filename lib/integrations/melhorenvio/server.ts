import 'server-only'
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

/** Tudo aqui roda só no servidor. Tokens e segredos nunca chegam ao navegador. */

export type Tokens = { access: string; refresh: string; expiresAt: number; refreshExpiresAt: number }
export type Settings = {
  mode: 'fixo' | 'calculado'
  originCep: string
  height: number
  width: number
  length: number
  weight: number
  services: string[]
}

export const DEFAULT_SETTINGS: Settings = { mode: 'fixo', originCep: '', height: 0, width: 0, length: 0, weight: 0, services: [] }

const SCOPES = 'shipping-calculate shipping-companies users-read cart-read cart-write shipping-checkout shipping-generate shipping-print shipping-tracking orders-read'
const env = () => ({
  id: process.env.MELHOR_ENVIO_CLIENT_ID,
  secret: process.env.MELHOR_ENVIO_CLIENT_SECRET,
  redirect: process.env.MELHOR_ENVIO_REDIRECT_URI,
  contact: process.env.MELHOR_ENVIO_CONTACT_EMAIL,
  key: process.env.MELHOR_ENVIO_ENCRYPTION_KEY,
  admin: process.env.ADMIN_ACCESS_CODE,
  db: process.env.DATABASE_URL,
  base: process.env.MELHOR_ENVIO_ENV === 'production' ? 'https://melhorenvio.com.br' : 'https://sandbox.melhorenvio.com.br',
})

/** Só a presença de cada variável, nunca o valor. */
export function setup() {
  const e = env()
  const missing = Object.entries({
    MELHOR_ENVIO_CLIENT_ID: e.id, MELHOR_ENVIO_CLIENT_SECRET: e.secret, MELHOR_ENVIO_REDIRECT_URI: e.redirect,
    MELHOR_ENVIO_CONTACT_EMAIL: e.contact, MELHOR_ENVIO_ENCRYPTION_KEY: e.key, ADMIN_ACCESS_CODE: e.admin, DATABASE_URL: e.db,
  }).filter(([, v]) => !v).map(([k]) => k)
  return { ready: missing.length === 0, missing, environment: process.env.MELHOR_ENVIO_ENV === 'production' ? 'production' : 'sandbox' }
}

/* ---- Armazenamento: Neon PostgreSQL, com tokens cifrados em AES-256-GCM ---- */

async function sql(text: string, params: unknown[] = []) {
  const { neon } = await import('@neondatabase/serverless')
  return neon(env().db as string).query(text, params) as Promise<Record<string, string>[]>
}

const key = () => createHash('sha256').update(env().key as string).digest()

function seal(plain: string) {
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), data]).toString('base64')
}

function open(blob: string) {
  const raw = Buffer.from(blob, 'base64')
  const d = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
  d.setAuthTag(raw.subarray(12, 28))
  return Buffer.concat([d.update(raw.subarray(28)), d.final()]).toString('utf8')
}

async function read(name: string) {
  const rows = await sql('select value from integration_settings where key = $1', [name])
  return rows[0]?.value ?? null
}

async function write(name: string, value: string) {
  await sql('insert into integration_settings (key, value) values ($1, $2) on conflict (key) do update set value = excluded.value, updated_at = now()', [name, value])
}

export async function getSettings(): Promise<Settings> {
  const v = await read('me_settings')
  return v ? { ...DEFAULT_SETTINGS, ...JSON.parse(v) } : DEFAULT_SETTINGS
}

export const saveSettings = (s: Settings) => write('me_settings', JSON.stringify(s))

export async function getTokens(): Promise<Tokens | null> {
  const v = await read('me_tokens')
  return v ? JSON.parse(open(v)) : null
}

const saveTokens = (t: Tokens) => write('me_tokens', seal(JSON.stringify(t)))

export async function clearTokens() {
  await sql('delete from integration_settings where key = $1', ['me_tokens'])
}

/* ---- Sessão do administrador: cookie assinado, httpOnly ---- */

const ADMIN_COOKIE = 'okl_admin'
const sign = (v: string) => createHmac('sha256', env().admin as string).update(v).digest('hex')
const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

export async function login(code: string) {
  const expected = env().admin
  if (!expected || !same(sign(code), sign(expected))) return false
  const until = String(Date.now() + 8 * 3_600_000)
  ;(await cookies()).set(ADMIN_COOKIE, `${until}.${sign(until)}`, { httpOnly: true, secure: true, sameSite: 'strict', path: '/', maxAge: 8 * 3600 })
  return true
}

export async function isAdmin() {
  if (!env().admin) return false
  const [until, mac] = ((await cookies()).get(ADMIN_COOKIE)?.value ?? '').split('.')
  return !!until && !!mac && Number(until) > Date.now() && same(mac, sign(until))
}

/* ---- API do Melhor Envio ---- */

export class MelhorEnvioError extends Error {
  constructor(message: string, public status = 502, public reauth = false) { super(message) }
}

const headers = () => ({ Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': `Oliveira OKL (${env().contact})` })

export function authorizeUrl(state: string) {
  const e = env()
  const q = new URLSearchParams({ client_id: e.id as string, redirect_uri: e.redirect as string, response_type: 'code', state, scope: SCOPES })
  return `${e.base}/oauth/authorize?${q}`
}

async function tokenRequest(body: Record<string, string>) {
  const e = env()
  const r = await fetch(`${e.base}/oauth/token`, { method: 'POST', headers: headers(), body: JSON.stringify({ client_id: e.id, client_secret: e.secret, ...body }), cache: 'no-store' })
  if (!r.ok) throw new MelhorEnvioError('O Melhor Envio recusou a autorização.', 401, true)
  const d = await r.json() as { access_token: string; refresh_token: string; expires_in: number }
  const now = Date.now()
  const t: Tokens = { access: d.access_token, refresh: d.refresh_token, expiresAt: now + d.expires_in * 1000, refreshExpiresAt: now + 45 * 86_400_000 }
  await saveTokens(t)
  return t
}

export const exchangeCode = (code: string) => tokenRequest({ grant_type: 'authorization_code', redirect_uri: env().redirect as string, code })

async function validToken() {
  const t = await getTokens()
  if (!t) throw new MelhorEnvioError('Melhor Envio não conectado.', 409, true)
  if (t.expiresAt - Date.now() > 86_400_000) return t.access
  if (t.refreshExpiresAt < Date.now()) throw new MelhorEnvioError('Autorização expirada. Conecte novamente.', 401, true)
  return (await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh })).access
}

async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const token = await validToken()
  const r = await fetch(`${env().base}${path}`, {
    method: init?.method ?? 'GET',
    headers: { ...headers(), Authorization: `Bearer ${token}` },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  })
  if (r.status === 401) throw new MelhorEnvioError('Autorização inválida. Conecte novamente.', 401, true)
  if (!r.ok) throw new MelhorEnvioError(`Melhor Envio respondeu com erro ${r.status}.`, r.status === 422 ? 422 : 502)
  return r.json() as Promise<T>
}

export const account = () => api<{ firstname?: string; lastname?: string; email?: string }>('/api/v2/me')

export async function listServices() {
  const r = await fetch(`${env().base}/api/v2/me/shipment/services`, { headers: headers(), cache: 'no-store' })
  if (!r.ok) throw new MelhorEnvioError('Não foi possível listar os serviços.')
  const d = await r.json() as { id: number; name: string; company: { name: string } }[]
  return d.map((s) => ({ id: String(s.id), name: s.name, company: s.company.name }))
}

type Quote = {
  id: number; name: string; error?: string; custom_price?: string; price?: string
  custom_delivery_time?: number; delivery_time?: number; company?: { name: string }
}

export async function quote(to: string, pieces: number, value: number, s: Settings) {
  if (!s.originCep) throw new MelhorEnvioError('CEP de origem não configurado.', 409)
  if (![s.height, s.width, s.length, s.weight].every((n) => n > 0)) throw new MelhorEnvioError('Dimensões e peso não configurados.', 409)
  const d = await api<Quote[]>('/api/v2/me/shipment/calculate', {
    method: 'POST',
    body: {
      from: { postal_code: s.originCep },
      to: { postal_code: to },
      products: [{ id: 'pedido', width: s.width, height: s.height, length: s.length, weight: s.weight, insurance_value: Number((value / pieces).toFixed(2)), quantity: pieces }],
      options: { receipt: false, own_hand: false },
      ...(s.services.length ? { services: s.services.join(',') } : {}),
    },
  })
  return d.filter((q) => !q.error).map((q) => ({
    id: String(q.id),
    company: q.company?.name ?? '',
    service: q.name,
    price: Number(q.custom_price ?? q.price),
    deadline: `até ${q.custom_delivery_time ?? q.delivery_time} dias úteis`,
    source: 'melhorenvio' as const,
  }))
}

/** Compra usa saldo real da carteira: só roda com MELHOR_ENVIO_ALLOW_PURCHASE=true, por decisão explícita. */
export const purchaseAllowed = () => process.env.MELHOR_ENVIO_ALLOW_PURCHASE === 'true'

export const shipment = {
  addToCart: (body: unknown) => api<{ id: string }>('/api/v2/me/cart', { method: 'POST', body }),
  checkout: (orders: string[]) => {
    if (!purchaseAllowed()) throw new MelhorEnvioError('Compra de frete desativada neste ambiente.', 403)
    return api('/api/v2/me/shipment/checkout', { method: 'POST', body: { orders } })
  },
  generate: (orders: string[]) => api('/api/v2/me/shipment/generate', { method: 'POST', body: { orders } }),
  print: (orders: string[]) => api<{ url: string }>('/api/v2/me/shipment/print', { method: 'POST', body: { orders } }),
  tracking: (orders: string[]) => api('/api/v2/me/shipment/tracking', { method: 'POST', body: { orders } }),
}
