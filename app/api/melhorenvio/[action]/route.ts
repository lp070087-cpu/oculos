import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { bySlug } from '@/lib/catalog'
import { MelhorEnvioError, account, authorizeUrl, clearTokens, exchangeCode, getSettings, getTokens, isAdmin, listServices, login, purchaseAllowed, quote, saveSettings, setup, shipment } from '@/lib/integrations/melhorenvio/server'

const STATE_COOKIE = 'okl_me_state'
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
const fail = (e: unknown) => (e instanceof MelhorEnvioError ? json({ error: e.message, reauth: e.reauth }, e.status) : json({ error: 'Falha na integração.' }, 500))

const settingsSchema = z.object({
  mode: z.enum(['fixo', 'calculado']),
  originCep: z.string().regex(/^\d{8}$|^$/),
  height: z.number().min(0).max(200), width: z.number().min(0).max(200), length: z.number().min(0).max(200), weight: z.number().min(0).max(100),
  services: z.array(z.string().regex(/^\d+$/)).max(40),
})
const quoteSchema = z.object({ cep: z.string().regex(/^\d{8}$/), items: z.array(z.object({ slug: z.string().max(120), qty: z.number().int().min(1).max(500) })).min(1).max(100) })
const shipmentSchema = z.object({ action: z.enum(['checkout', 'generate', 'print', 'tracking']), orders: z.array(z.string().uuid()).min(1).max(20) })

export async function GET(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params
  const conf = setup()
  try {
    if (action === 'config') {
      if (!conf.ready) return json({ real: false, mode: 'fixo' })
      const [s, t] = await Promise.all([getSettings(), getTokens()])
      return json({ real: !!t, mode: t ? s.mode : 'fixo' })
    }
    if (action === 'status') {
      const admin = await isAdmin()
      const base = { configured: conf.ready, missing: conf.missing, environment: conf.environment, admin, purchase: purchaseAllowed() }
      if (!conf.ready || !admin) return json({ ...base, connected: false })
      const t = await getTokens()
      if (!t) return json({ ...base, connected: false, settings: await getSettings() })
      const settings = await getSettings()
      const expired = t.refreshExpiresAt < Date.now()
      const me = expired ? null : await account().catch(() => null)
      return json({ ...base, connected: !expired, expired, expiresAt: t.expiresAt, account: me && { name: [me.firstname, me.lastname].filter(Boolean).join(' '), email: me.email }, settings })
    }
    if (!conf.ready) return json({ error: 'Integração não configurada.' }, 503)
    if (action === 'connect') {
      if (!(await isAdmin())) return json({ error: 'Acesso restrito.' }, 401)
      const state = randomBytes(24).toString('hex')
      const res = NextResponse.redirect(authorizeUrl(state))
      res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/melhorenvio', maxAge: 600 })
      return res
    }
    if (action === 'callback') {
      const page = new URL('/painel/configuracoes/entregas/melhor-envio', req.url)
      const jar = await cookies()
      const expected = jar.get(STATE_COOKIE)?.value
      jar.delete(STATE_COOKIE)
      const code = req.nextUrl.searchParams.get('code')
      if (!expected || req.nextUrl.searchParams.get('state') !== expected || !code || !(await isAdmin())) {
        page.searchParams.set('me', 'erro')
        return NextResponse.redirect(page)
      }
      await exchangeCode(code)
      page.searchParams.set('me', 'conectado')
      return NextResponse.redirect(page)
    }
    if (action === 'services') {
      if (!(await isAdmin())) return json({ error: 'Acesso restrito.' }, 401)
      return json(await listServices())
    }
    return json({ error: 'Rota inexistente.' }, 404)
  } catch (e) {
    return fail(e)
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params
  if (!setup().ready) return json({ error: 'Integração não configurada.' }, 503)
  try {
    const body = await req.json().catch(() => ({}))
    if (action === 'login') return (await login(String(body.code ?? ''))) ? json({ ok: true }) : json({ error: 'Código inválido.' }, 401)
    if (action === 'quote') {
      const q = quoteSchema.safeParse(body)
      if (!q.success) return json({ error: 'Dados de cotação inválidos.' }, 400)
      const s = await getSettings()
      if (s.mode !== 'calculado') return json({ error: 'Frete calculado desativado.' }, 409)
      // Preço vem do catálogo do servidor: o valor segurado não depende do navegador.
      const pieces = q.data.items.reduce((n, i) => n + i.qty, 0)
      const value = q.data.items.reduce((n, i) => n + (bySlug(i.slug)?.price ?? 0) * i.qty, 0)
      return json(await quote(q.data.cep, pieces, value, s))
    }
    if (!(await isAdmin())) return json({ error: 'Acesso restrito.' }, 401)
    if (action === 'settings') {
      const s = settingsSchema.safeParse(body)
      if (!s.success) return json({ error: 'Configuração inválida.' }, 400)
      await saveSettings(s.data)
      return json({ ok: true })
    }
    if (action === 'disconnect') {
      await clearTokens()
      return json({ ok: true })
    }
    if (action === 'shipment') {
      const s = shipmentSchema.safeParse(body)
      if (!s.success) return json({ error: 'Pedido inválido.' }, 400)
      return json(await shipment[s.data.action](s.data.orders))
    }
    return json({ error: 'Rota inexistente.' }, 404)
  } catch (e) {
    return fail(e)
  }
}
