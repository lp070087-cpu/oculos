'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { demo, useHydrated } from '@/lib/demo/store'

/** Link de retomada enviado na recuperação. Na demonstração o carrinho só existe neste navegador. */
export default function Resume() {
  const { token } = useParams<{ token: string }>()
  const ready = useHydrated()
  const router = useRouter()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!ready) return
    if (demo.resumeCart(token)) router.replace('/checkout')
    else setFailed(true)
  }, [ready, token, router])

  return (
    <div className="wrap empty page-pad">
      {failed ? (
        <>
          <h1>Carrinho indisponível</h1>
          <p className="muted">O link expirou ou o pedido já foi finalizado.</p>
          <Link className="btn" href="/produtos">Ver coleção</Link>
        </>
      ) : <p className="muted">Recuperando seu carrinho…</p>}
    </div>
  )
}
