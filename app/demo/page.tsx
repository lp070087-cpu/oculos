'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { demo } from '@/lib/demo/store'
import { toast } from '@/lib/ui'
import { Logo, Wave } from '@/components/ui'

const STEPS = [
  { t: 'Compra', d: 'Escolha um produto, selecione a cor, some 6 peças e finalize o pedido de teste.', href: '/produtos', cta: 'Abrir a loja' },
  { t: 'Recebimento', d: 'Deixe o painel aberto em outra aba: o pedido chega sozinho, com cliente e itens.', href: '/painel/pedidos', cta: 'Abrir pedidos' },
  { t: 'Atendimento', d: 'Na conta do cliente, envie uma mensagem. Ela aparece na central da loja.', href: '/conta/atendimento', cta: 'Abrir atendimento' },
  { t: 'Inteligência artificial', d: 'A IA demonstrativa sugere a resposta com base no pedido. Aprove, edite ou descarte.', href: '/painel/whatsapp', cta: 'Abrir central' },
  { t: 'Promoção', d: 'Crie uma campanha, escolha o público com consentimento e veja a prévia.', href: '/painel/marketing', cta: 'Abrir marketing' },
]

export default function DemoScript() {
  return (
    <main className="script">
      <Logo />
      <h1 style={{ marginTop: 40 }}>Roteiro da apresentação</h1>
      <p>Cinco cenários ligados entre si. Para o efeito completo, abra a loja e o painel em abas separadas do mesmo navegador.</p>
      <Wave seed={9} bars={160} className="wave-sep" />
      <ol>
        {STEPS.map((s, i) => (
          <li key={s.t}>
            <span>0{i + 1}</span>
            <div><h2>{s.t}</h2><p>{s.d}</p></div>
            <Link className="btn btn-ghost" href={s.href}>{s.cta} <ArrowRight size={16} aria-hidden /></Link>
          </li>
        ))}
      </ol>
      <div className="script-foot">
        <span>Clientes, pedidos e estoques são fictícios. Nenhuma mensagem ou pagamento real é processado.</span>
        <button className="btn btn-ghost btn-sm" onClick={() => { demo.reset(); toast('Demonstração restaurada') }}>Restaurar demonstração</button>
      </div>
    </main>
  )
}
