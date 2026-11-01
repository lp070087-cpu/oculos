'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

const SLIDES = [
  {
    id: 'new-frequency', tag: 'Campanha 01', title: ['SEU ESTILO.', 'SEM FRONTEIRAS.'], size: 'xs', flag: ['ENVIAMOS PARA', 'TODO O BRASIL'],
    text: 'Da nossa loja para todo o Brasil. Escolha seus modelos favoritos, monte seu pedido e receba onde estiver.',
    cta: 'Explorar coleção', href: '/produtos',
  },
  {
    id: 'your-frequency', tag: 'Campanha 02', title: ['YOUR STYLE.', 'YOUR', 'FREQUENCY.'], size: 'sm',
    text: 'Monte seu pedido com 6 peças, misture os modelos e receba em todo o Brasil.',
    cta: 'Conhecer os produtos', href: '/produtos',
  },
]
const DURATION = 8000

export function Hero() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hold, setHold] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [ready, setReady] = useState(false)
  const videos = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    const r = window.matchMedia('(prefers-reduced-motion: reduce)')
    const m = window.matchMedia('(max-width: 760px)')
    const on = () => { setReduced(r.matches); setMobile(m.matches); setReady(true) }
    on()
    r.addEventListener('change', on); m.addEventListener('change', on)
    return () => { r.removeEventListener('change', on); m.removeEventListener('change', on) }
  }, [])

  useEffect(() => { if (reduced) setPaused(true) }, [reduced])

  useEffect(() => {
    if (paused || hold) return
    const t = setTimeout(() => setI((v) => (v + 1) % SLIDES.length), DURATION)
    return () => clearTimeout(t)
  }, [i, paused, hold])

  useEffect(() => {
    videos.current.forEach((v, n) => {
      if (!v) return
      if (n === i && !paused) v.play().catch(() => {})
      else v.pause()
    })
  }, [i, paused, mobile, ready])

  const go = (d: number) => setI((v) => (v + d + SLIDES.length) % SLIDES.length)
  const f = mobile ? 'mobile' : 'desktop'

  return (
    <section
      className="hero" aria-roledescription="carrossel" aria-label="Campanhas"
      onMouseEnter={() => setHold(true)} onMouseLeave={() => setHold(false)}
      onFocusCapture={() => setHold(true)} onBlurCapture={() => setHold(false)}
    >
      {SLIDES.map((s, n) => (
        <div key={s.id} className={`hero-slide ${n === i ? 'on' : ''}`} aria-hidden={n !== i} aria-roledescription="slide" aria-label={`${n + 1} de ${SLIDES.length}`}>
          <picture>
            <source media="(max-width: 760px)" srcSet={`/banners/${s.id}-mobile.webp`} />
            <img src={`/banners/${s.id}-desktop.webp`} alt="" />
          </picture>
          {ready && !reduced && n === i && (
            <video key={f} ref={(el) => { videos.current[n] = el }} muted loop playsInline preload="auto" poster={`/banners/${s.id}-${f}.webp`}>
              <source src={`/banners/${s.id}-${f}.webm`} type="video/webm" />
              <source src={`/banners/${s.id}-${f}.mp4`} type="video/mp4" />
            </video>
          )}
          {s.flag && <p className="hero-flag">{s.flag.map((t) => <span key={t}>{t}</span>)}</p>}
          <div className="hero-copy">
            <span className="eyebrow">{s.tag}</span>
            <h2 className={`hero-title hero-title-${s.size}`}>
              {s.title.map((t, k) => <span key={t}><i style={{ transitionDelay: `${120 + k * 90}ms` }}>{t}</i></span>)}
            </h2>
            <p>{s.text}</p>
            <Link className="btn" href={s.href} tabIndex={n === i ? 0 : -1}>{s.cta} <ArrowRight size={17} aria-hidden /></Link>
          </div>
        </div>
      ))}
      <div className="hero-ctrl">
        <div className="hero-dots" role="tablist" aria-label="Escolher campanha">
          {SLIDES.map((s, n) => (
            <button key={s.id} role="tab" aria-selected={n === i} aria-label={`Campanha ${n + 1}`} onClick={() => setI(n)}>
              <span>0{n + 1}</span>
              <i><b key={`${i}-${paused || hold}`} className={n === i && !paused && !hold ? 'run' : n === i ? 'full' : ''} style={{ animationDuration: `${DURATION}ms` }} /></i>
            </button>
          ))}
        </div>
        <div className="hero-btns">
          <button className="icon-btn" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Reproduzir banners' : 'Pausar banners'}>{paused ? <Play size={17} /> : <Pause size={17} />}</button>
          <button className="icon-btn" onClick={() => go(-1)} aria-label="Campanha anterior"><ChevronLeft size={20} /></button>
          <button className="icon-btn" onClick={() => go(1)} aria-label="Próxima campanha"><ChevronRight size={20} /></button>
        </div>
      </div>
    </section>
  )
}
