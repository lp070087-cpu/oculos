'use client'

import { useSyncExternalStore } from 'react'

type Toast = { id: number; text: string; href?: string; action?: string }
type Ui = { cartOpen: boolean; toasts: Toast[] }

let ui: Ui = { cartOpen: false, toasts: [] }
const ls = new Set<() => void>()
const emit = () => ls.forEach((l) => l())
const server: Ui = { cartOpen: false, toasts: [] }

export const useUi = () => useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l) }, () => ui, () => server)

export function setCartOpen(cartOpen: boolean) {
  ui = { ...ui, cartOpen }
  emit()
}

export function toast(text: string, opts?: { href?: string; action?: string }) {
  const id = Date.now() + Math.random()
  ui = { ...ui, toasts: [...ui.toasts.filter((t) => t.text !== text).slice(-2), { id, text, ...opts }] }
  emit()
  setTimeout(() => { ui = { ...ui, toasts: ui.toasts.filter((t) => t.id !== id) }; emit() }, 6500)
}

const TZ = 'America/Sao_Paulo'
export const fmtDate = (t: number) => new Date(t).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: 'short' }).replace('.', '')
export const fmtTime = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
export const fmtDateTime = (t: number) => `${fmtDate(t)}, ${fmtTime(t)}`
