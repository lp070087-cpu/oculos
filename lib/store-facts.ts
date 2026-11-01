/** Dados confirmados na loja e no Instagram em 31/10/2026. Nada aqui é inventado. */
export const STORE = {
  name: 'Oliveira OKL',
  owner: 'Renato Pardal de Oliveira',
  city: 'São Paulo - SP',
  phoneDisplay: '(11) 98849-1805',
  phoneE164: '5511988491805',
  instagram: 'https://www.instagram.com/okl.reholiveira',
  instagramHandle: '@okl.reholiveira',
  catalogUrl: 'https://oliveiraokl.vendizap.com/',
  bio: 'Sou seu fornecedor e te ajudo a vender mais',
  years: 10,
  minPieces: 6,
  shipping: 40,
}

/** Modo atual. Tudo que depende de credencial real passa por aqui. */
export const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE === 'production' ? 'production' : 'demo'
