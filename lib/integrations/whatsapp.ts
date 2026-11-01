import { APP_MODE } from '@/lib/store-facts'

export type OutboundMessage = { to: string; text?: string; templateName?: string }
export type SendResult = { ok: boolean; simulated: boolean; id?: string; error?: string }

/** Contrato único da integração. As telas nunca falam com a Meta diretamente. */
export interface WhatsAppProvider {
  readonly name: string
  send(msg: OutboundMessage): Promise<SendResult>
}

class DemoProvider implements WhatsAppProvider {
  readonly name = 'demo'
  async send(): Promise<SendResult> {
    return { ok: true, simulated: true, id: `sim-${Date.now()}` }
  }
}

/** Ponto de entrada da Cloud API oficial. Deve rodar só no servidor e não está implementado. */
class CloudApiProvider implements WhatsAppProvider {
  readonly name = 'meta-cloud-api'
  async send(): Promise<SendResult> {
    return { ok: false, simulated: false, error: 'Integração oficial não configurada: requer WABA, número verificado e templates aprovados.' }
  }
}

export const whatsapp: WhatsAppProvider = APP_MODE === 'production' ? new CloudApiProvider() : new DemoProvider()
