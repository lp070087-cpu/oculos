import { STORE } from '@/lib/store-facts'
import type { ShippingOption } from '@/lib/demo/types'

export const onlyDigits = (s: string) => s.replace(/\D/g, '').slice(0, 8)
export const formatCep = (s: string) => { const d = onlyDigits(s); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d }

export const FIXED_OPTION: ShippingOption = { id: 'fixo', company: 'Oliveira OKL', service: 'Frete fixo', price: STORE.shipping, deadline: 'Prazo combinado com a loja', source: 'fixo' }
export const PICKUP_OPTION: ShippingOption = { id: 'retirada', company: 'Oliveira OKL', service: 'Retirada em São Paulo', price: 0, deadline: 'Regra a confirmar com a loja', source: 'retirada' }

export const DEMO_SERVICES = [
  { id: 'demo-eco', name: 'Econômico (simulado)', company: 'Transportadora Demo' },
  { id: 'demo-exp', name: 'Expresso (simulado)', company: 'Transportadora Demo' },
]

/** Valores ilustrativos e determinísticos. Não são cotação de nenhuma transportadora. */
export function demoQuotes(cep: string, pieces: number, enabled: string[]): ShippingOption[] {
  const region = Number(cep[0])
  const distance = Math.abs(region - 1)
  const eco = 20 + distance * 4 + pieces * 0.5
  return DEMO_SERVICES.filter((s) => enabled.includes(s.id)).map((s) => {
    const fast = s.id === 'demo-exp'
    return {
      id: s.id, company: s.company, service: s.name,
      price: Math.round((fast ? eco * 1.6 : eco) * 100) / 100,
      deadline: `até ${(fast ? 2 : 5) + distance} dias úteis (simulado)`,
      source: 'demo',
    }
  })
}
