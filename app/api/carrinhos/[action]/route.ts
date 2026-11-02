import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { isAdmin } from '@/lib/integrations/melhorenvio/server'
import { RecoveryError, optOut, persistenceReady, registerCart, sendRecovery } from '@/lib/integrations/cart-recovery/server'
import { APP_MODE } from '@/lib/store-facts'

const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })

const token = z.string().regex(/^[a-f0-9]{32}$/)
const registerSchema = z.object({ token, items: z.array(z.object({ slug: z.string().max(120), qty: z.number().int().min(1).max(500) })).max(100) })
const sendSchema = z.object({ token, text: z.string().trim().min(1).max(1000) })

export async function POST(req: NextRequest, ctx: { params: Promise<{ action: string }> }) {
  const { action } = await ctx.params
  // Na demonstração nada é gravado nem enviado: tudo fica no navegador.
  if (APP_MODE !== 'production') return json({ error: 'Modo demonstração: persistência e envio real desligados.' }, 403)
  if (!persistenceReady()) return json({ error: 'Persistência não configurada.' }, 503)
  const body = await req.json().catch(() => ({}))
  try {
    if (action === 'registrar') {
      const b = registerSchema.safeParse(body)
      if (!b.success) return json({ error: 'Carrinho inválido.' }, 400)
      return json(await registerCart(b.data.token, b.data.items))
    }
    if (action === 'descadastro') {
      const b = z.object({ token }).safeParse(body)
      if (!b.success) return json({ error: 'Link inválido.' }, 400)
      return json(await optOut(b.data.token))
    }
    if (action === 'enviar') {
      if (!(await isAdmin())) return json({ error: 'Acesso restrito.' }, 401)
      const b = sendSchema.safeParse(body)
      if (!b.success) return json({ error: 'Mensagem inválida.' }, 400)
      return json(await sendRecovery(b.data.token, b.data.text))
    }
    return json({ error: 'Rota inexistente.' }, 404)
  } catch (e) {
    return e instanceof RecoveryError ? json({ error: e.message }, e.status) : json({ error: 'Falha na recuperação de carrinho.' }, 500)
  }
}
