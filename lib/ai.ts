import { brl, normalize } from '@/lib/catalog'
import { STORE } from '@/lib/store-facts'
import { catalog } from '@/lib/demo/store'
import type { Conversation, DemoState } from '@/lib/demo/types'

export type Suggestion = { text: string; reason: string }

const STATUS: Record<string, string> = {
  novo: 'recebido e aguardando separação', separacao: 'em separação', enviado: 'enviado', entregue: 'entregue', cancelado: 'cancelado',
}

/**
 * IA DEMONSTRATIVA: regras locais sobre os dados da conversa. Nenhum modelo externo é chamado.
 * Em produção, troque por uma chamada de servidor que receba este mesmo contexto.
 */
export function suggestReply(conv: Conversation, s: DemoState): Suggestion {
  const last = [...conv.messages].reverse().find((m) => m.from === 'cliente')
  const text = normalize(last?.text ?? '')
  const name = conv.name.split(' ')[0]
  const order = s.orders.find((o) => o.customerId === conv.customerId && o.status !== 'entregue' && o.status !== 'cancelado')

  if (conv.tags.includes('Carrinho abandonado') && !last) {
    return { text: `Oi, ${name}! Seu carrinho ficou com 4 peças. Faltam 2 para o mínimo de ${STORE.minPieces}, e você pode mesclar os modelos. Quer ajuda para fechar?`, reason: 'Etiqueta de carrinho abandonado, contato autorizado' }
  }
  if (/pedido|separad|rastre|chegou|enviad|entrega/.test(text)) {
    if (order) {
      const pieces = order.items.reduce((n, i) => n + i.qty, 0)
      return { text: `Oi, ${name}! Seu pedido ${order.id} (${pieces} peças) está ${STATUS[order.status]}${order.tracking ? `, código ${order.tracking}` : ''}. Qualquer novidade te aviso por aqui.`, reason: `Pedido ${order.id} encontrado para este cliente` }
    }
    return { text: `Oi, ${name}! Não localizei pedido em aberto neste número. Pode me passar o código do pedido?`, reason: 'Sem pedido aberto vinculado ao contato' }
  }
  const asksFreight = /frete|envia|envio|natal|rio|estado/.test(text)
  const asksMin = /minimo|quantas|atacado|quantidade/.test(text)
  const earlier = normalize(conv.messages.filter((m) => m.from === 'cliente').map((m) => m.text).join(' '))
  if (asksFreight || asksMin) {
    const both = /minimo|quantas|atacado/.test(earlier) && /frete|envia/.test(earlier)
    const parts = [
      (asksMin || both) && `o pedido mínimo é de ${STORE.minPieces} peças e você pode mesclar os modelos`,
      (asksFreight || both) && `o frete é fixo de ${brl(STORE.shipping)} e enviamos para todo o Brasil`,
    ].filter(Boolean)
    return { text: `Oi, ${name}! No atacado, ${parts.join(', e ')}. Quer que eu te mande os modelos em destaque?`, reason: 'Regras comerciais publicadas pela loja' }
  }
  if (/pix|pagamento|cartao|pagar/.test(text)) {
    return { text: `Oi, ${name}! Vou confirmar com você as formas de pagamento disponíveis para fechar seu pedido.`, reason: 'Regras de pagamento devem ser confirmadas pela loja' }
  }
  const words = text.split(/\s+/).filter((w) => w.length > 3)
  const match = catalog(s).filter((p) => words.filter((w) => normalize(p.name).includes(w)).length >= 2).sort((a, b) => (s.stock[b.slug] ?? 0) - (s.stock[a.slug] ?? 0))[0]
  if (match) {
    const qty = s.stock[match.slug] ?? 0
    return { text: qty > 0 ? `Oi, ${name}! Temos ${match.name} por ${brl(match.price)} a peça, com ${qty} unidades na demonstração. Quer que eu separe?` : `Oi, ${name}! ${match.name} está esgotado agora. Posso sugerir outra cor da mesma linha?`, reason: `Produto localizado no catálogo: ${match.name}` }
  }
  return { text: `Oi, ${name}! Obrigado pelo contato. Como posso ajudar com seu pedido?`, reason: 'Sem intenção específica identificada' }
}
