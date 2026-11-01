/**
 * Catálogo real extraído de oliveiraokl.vendizap.com em 31/10/2026.
 * Nome, preço, preço promocional, disponibilidade e foto são os publicados pela loja.
 * Estoque numérico NÃO é publicado pela loja: fica em lib/demo/seed.ts como dado fictício.
 */
export type Product = {
  slug: string
  name: string
  family: string
  categoryId: string
  variant: string
  swatch: string
  price: number
  oldPrice?: number
  image: string
  featured?: boolean
  limited?: boolean
  soldOut?: boolean
}

export type Category = { id: string; label: string; image: string; note: string }

/** Linhas com fotos de produto em /public, navegáveis na demonstração. */
export const CATEGORIES: Category[] = [
  { id: 'juliet', label: 'Juliet', image: '170b929d00eb662f846a51149543d4b6', note: '25 versões' },
  { id: 'flack', label: 'Flack 2.0', image: '40478d7c4eb994cf814311981b35ea10', note: '11 versões' },
  { id: 'doublex', label: 'Doublex', image: '6be4363c4e1d473c236a7f6e66f7c451', note: '6 versões' },
  { id: 'penny', label: 'Penny', image: 'a6b209b8db80fb96650650a707973d5f', note: '3 versões' },
  { id: 'deadbolt', label: 'Deadbolt', image: '9d73d31bac21364e05d8397de966fa28', note: '3 versões' },
  { id: 'gascan', label: 'Gascan', image: '8a0c1ce3fb93d8b1acf5aa038b8f831e', note: '2 versões' },
  { id: 'dart', label: 'Dart', image: 'f9be6925dc49eb3b199b289439943b32', note: 'Edition' },
  { id: 'eye-jacket', label: 'Eye Jacket', image: 'dc1e4c5241d4c948373138d6dbedb7b3', note: 'Neon blue' },
  { id: 'ouro', label: 'Banhados a ouro 18k', image: '2b617def060d0978ab02db77f3e40661', note: 'Corrente + pulseira + pingente' },
  { id: 'acessorios', label: 'Acessórios', image: 'b0630b04a502f48ab706472f82abc971', note: 'Estojos' },
]

/** Todas as categorias publicadas na loja atual e sua miniatura real. */
export const STORE_INDEX: { label: string; image: string }[] = [
  ['Bonés premium', '0ee4cb4cde69b2e6cbac0b7aa19f27d7'], ['Juliete', 'e811dc2d754bd68b227eecb688853d13'],
  ['Terraforma', 'df71fb75055f51a63802451c4086d68b'], ['Novidades', '786904ee0889c507003d529bfd7371d3'],
  ['Monster Dog', '157098de984066766291162a3cbdb70c'], ['Highland', 'de83006fba166e8242893427cba40e81'],
  ['Banhados a ouro 18k', '18f4bc6704d8f3d9e0fead797f6d368b'], ['Relógios', '5af6569648d094ad5bdd40627e5aa37c'],
  ['Penny', '81a525ab8e7fe21fe13014c31fb0a2b7'], ['Plantaris', '6725f85b9f9bb5f3ca9d1dd2ce0b9514'],
  ['Lupas R$ 17,00', '122d8fecaeb79d04cba108a8bce44236'], ['Doublex', 'b35ca59959d64e25b28a99ba1246f282'],
  ['Thump', '666941589ce46edf7395f2cc0a055422'], ['Grifes', '5039ada5acf7b99516f52354eab81b48'],
  ['Plantaris quadrada', 'f8013e6761d6a0cd5522fa4d389d67f5'], ['Radar EV', '9159d44851c2b08d13365430db6f2c13'],
  ['As do chefe', '5ed10c05f3b3b2bdacb46d6f622bcf44'], ['Copa do Mundo', '6b8ef120848e2c2480e5518f8fe682bf'],
  ['Plate', 'c3936fa8740246cd0fb52eef7d2bc8f2'], ['Permian', '655f82a5519960cacc63e39983d53173'],
  ['Eye Jacket', '576c6a784b7009f45ee08adbdbb7723e'], ['Splice', '63cbaf5f3d9a169a2cb26b9404c47d1e'],
  ['Romeo2', '2493edc35479f490af027df76350d751'], ['Flack 2.0', '4acf0c6017a481faf7b52b32ffc48fc5'],
  ['Gascan', '4cbe1e54091c2567f2710b56083c29a5'], ['Romeo1', '52c8e33af6d067d4e90a63c3f9285782'],
  ['Minute', 'bc4ff6f33093abbbb3c1d0a844cfb2dc'], ['Wire', '54312c2b2e7dd0b3e0334cc5c4ec0355'],
  ['Xquared', '5e9378da2835bc8009be96cb23569fe6'], ['OTT', '60d9726c2acb138140482bf61d976157'],
  ['Kit Radar 5 Lentes', 'e93c9c53ab6873571f89df14d8cd9b5d'], ['Dart', '39fed013e4bb5e652fe2618f7544ca3b'],
  ['Descanso', '94c3973e9c87d39ae1a2d1cf1d517756'], ['HSTN', 'a52b4f310d664f7dc801c3440a38e101'],
  ['Mars Jordan', '7aab33d0cdc161df32036177a748a81f'], ['Lupa de vilão', 'a436b850411ad1c4121f050c7f6dfc12'],
  ['Acessórios', 'c9d8f1271b331eee9e256faf374d787b'], ['Ellipse', 'f70b79c394b4e3a517b87186cfaca1bd'],
  ['Magnesium', 'af3151f79924364293b4edd1008b729b'],
].map(([label, image]) => ({ label, image }))

type Row = [image: string, variant: string, swatch: string, price?: number, oldPrice?: number]

const LENS = {
  ruby: '#d8282d', black: '#1b1b1d', sky: '#7fd4f2', mirror: '#c9ced3', navy: '#1f3fd1',
  tanz: '#a13bd6', gold: '#d9b441', cafe: '#a7792c', purple: '#6a35d9', green: '#25c98a', brown: '#6b4a32', white: '#ece9e2',
}

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function line(family: string, categoryId: string, basePrice: number, rows: Row[], extra: Partial<Product> = {}, baseOld?: number): Product[] {
  return rows.map(([image, variant, swatch, price, oldPrice]) => {
    const name = `${family} ${variant}`
    return { slug: slugify(name), name, family, categoryId, variant, swatch, price: price ?? basePrice, oldPrice: oldPrice ?? baseOld, image, ...extra }
  })
}

const juliet = (rows: Row[], extra?: Partial<Product>) => line('Juliet', 'juliet', 45, rows, extra)

export const PRODUCTS: Product[] = [
  ...line('Juliet Edição Limitada', 'juliet', 49, [
    ['3423f12877bc36204f28b08888d45fc1', 'Tio2 Torch', LENS.ruby],
    ['3581ce57a7ed8767bd858faf5431d6c3', 'Tio2 Black', LENS.black],
    ['a408bd866dbbbfcf94db17ab2317b197', 'Tio2 Azul Bebê', LENS.sky],
    ['141eb42fde90ecd637c8ff6f4ec1905a', 'Tio2 Espelhada', LENS.mirror],
  ], { featured: true, limited: true }),
  ...juliet([
    ['1a471c869b71f8e7923a91d4bdabb574', 'Polished Lente Torch', LENS.ruby],
    ['9f3bc987f17cc4c8e077131a54addd85', 'Polished Lente Black', LENS.black],
    ['243abe4e5dc8fa3cdf06fbb6f821bc13', 'Polished Azul Escura · Kit Azul', LENS.navy],
    ['74efa0e19ed25e6cd436805a56a5b7a4', 'Polished Lente Tanzanite', LENS.tanz],
    ['a6cec6351244abedfaa1b1965c171082', 'Tio2 Azul Claro', LENS.sky],
    ['deffcbf52c165555ae0c95e3f6d4e3ca', 'Tio2 Espelhada', LENS.mirror],
  ], { featured: true }),
  ...juliet([
    ['37e361b4c63d34d3aafae07758c36b79', 'Polished Lente Espelhada', LENS.mirror],
    ['97b138161d636b5bf6bc10ce4bdc3304', 'Polished Ruby · Kit Vermelho', LENS.ruby],
    ['8293580cd523f2d66527c1c085d75bfd', 'Preta Roxa · Kit Roxo + Side', LENS.purple, 69],
    ['d869ae674ed2db25ed1392d3783b2bb5', 'Tio2 Dourada', LENS.gold],
    ['ac51403db672be52bc2a32581358bf83', 'Tio2 Azul Escuro', LENS.navy],
    ['b54bfdfc3e428f922baf187493653abf', 'Tio2 Black', LENS.black],
    ['3d57c8f99557069da7071ffeb2320a36', 'Tio2 Gold Café', LENS.cafe],
    ['ce9ddb1b0ef06b38c063595c0325468c', 'Tio2 Roxa', LENS.purple],
    ['798ea8f5cb88db5d3e456aa04ded055f', 'Tio2 Ruby', LENS.ruby],
    ['5170d4d871ef0b91fb46b5717fa3f8bc', 'Tio2 Tanzanite', LENS.tanz],
    ['170b929d00eb662f846a51149543d4b6', 'Tio2 Verde', LENS.green],
    ['0dcec7e1da31a62f850b485c7b676bbd', '24K Xmetal Azul Escura', LENS.navy],
    ['fe08e12ab2a5ae4fb3176274d9f4a984', 'Plasma Tanzanite · Kit Vermelho', LENS.tanz],
    ['ccab77d7c9e7c082e04737e630805ea1', 'Preta Lente Espelhada · Kit Branco', LENS.mirror],
    ['a71158f3bd11d21e9ea9af3cac6c1438', 'Xmetal Preta · Kit Verde', LENS.black],
  ]),
  ...line('Penny', 'penny', 45, [
    ['598d2380516ffdf4dd3fd48a43d79753', 'Cooper Lente Preta', LENS.black],
    ['a6b209b8db80fb96650650a707973d5f', 'Corvette', LENS.black],
    ['d37d9fc50e502fa6bda093c02d79ad6f', 'Plasma Espelhada', LENS.mirror],
  ]),
  ...line('Doublex', 'doublex', 45, [
    ['6be4363c4e1d473c236a7f6e66f7c451', '24K Lente Roxa', LENS.purple],
    ['79af1e957351598bd231e7f464dd16f2', '24K Xmetal Lente Preta', LENS.black],
    ['9e37f77b56a50ff017877101cf62a36b', 'Corvette', LENS.black],
    ['5bef0ee6911d099eb406a11286c844b4', 'Tio2 Espelhada', LENS.mirror],
    ['136755a191fd690f4edb2214d6819a7e', 'Tio2 Preta', LENS.black],
    ['d6506b725ffa0956c081a872c7f7f47e', 'Tio2 Ruby', LENS.ruby],
  ]),
  ...line('Dart', 'dart', 70, [['f9be6925dc49eb3b199b289439943b32', 'Edition Degradê Areia', LENS.cafe]], {}, 100),
  ...line('Deadbolt', 'deadbolt', 79, [
    ['1b8c7a16eef6f8997b01b740dadd6820', 'Black Lente Roxa', LENS.purple],
    ['9d73d31bac21364e05d8397de966fa28', 'Gold 24K', LENS.gold, 89],
    ['8e561d6cfe562f522a4380f206748666', 'Plasma Lente Liquid Metal', LENS.mirror],
  ], {}, 150),
  ...line('Estojo', 'acessorios', 18, [['b0630b04a502f48ab706472f82abc971', '1 Zíper', LENS.black]], {}, 25),
  ...line('Eye Jacket', 'eye-jacket', 70, [['dc1e4c5241d4c948373138d6dbedb7b3', 'Black Lente Neon Blue', LENS.navy]], {}, 100),
  ...line('Flack 2.0', 'flack', 39, [
    ['52d31a080ecdc413000a4ef3c3a888b8', 'Branca Lente Azul Escura', LENS.navy],
    ['40478d7c4eb994cf814311981b35ea10', 'Branca Lente Ruby', LENS.ruby],
    ['fc6448d25a75d28d7121b4901021ac80', 'Marrom Lente Marrom', LENS.brown],
    ['a39267daa36870d34392dc5608fa4e9d', 'Preta Borracha Branca Lente Espelhada', LENS.mirror],
    ['572db783cfd55d235676e02a72d38f32', 'Preta Borracha Vermelha Lente Ruby', LENS.ruby],
    ['7d2d556bd7a3a583f053f1d513b0aa66', 'Preta Lente Azul Bebê', LENS.sky],
    ['d1be4d5feef2256c654c5ec8735ad225', 'Preta Lente Azul Escura', LENS.navy],
    ['bd61885461f07f0a8baf7aa685f9a88c', 'Preta Lente Espelhada', LENS.mirror],
    ['225060e63ac6a268789c55b8a6a3a13c', 'Preta Lente Preta', LENS.black],
    ['425d9f4efe0a68b3b47e48dbe81014c0', 'Preta Lente Ruby', LENS.ruby],
    ['6968f753b38b05bee5579e6ba7ca5ca3', 'Rosa Lente Azul Bebê', LENS.sky],
  ], {}, 45),
  ...line('Gascan', 'gascan', 39, [
    ['8a0c1ce3fb93d8b1acf5aa038b8f831e', 'All Black', LENS.black],
    ['86651cc5ad80a02da103feb42c393255', 'Black Lente Azul Bebê', LENS.sky],
  ], {}, 45),
  ...line('Corrente + Pulseira + Pingente', 'ouro', 69, ([
    ['1', '2b617def060d0978ab02db77f3e40661'], ['2', 'df5d506718ce02bcdc0fe0bcea417e1c'], ['3', '5ba6000ccacf8b2948e2c4536cee9000'],
    ['4', '8cd51aa34e0681d1dfe822ff65bd216c'], ['5', 'a30136733a5716526b85329d82433e2e'], ['10', 'ee17cfd33e339ffef29f65f350a74e53'],
    ['11', 'c9e492d241e1b2791ecddb45f3bf23ba'], ['12', 'd65ef7c8a02236b66a057a7bdf4ad8e1'], ['13', '499af674fee50b5b63d544ec4a8ca939'],
    ['14', 'aa9154f32bd9e69e63a1f50d47b2ac2a'], ['15', '07d353b31f0974c8116964f702c5a8b8'], ['16', '391b85ad582f3f7e0a40f74e54dc0bd1'],
    ['17', '1145184c1fb6a6da68dd6f0af1717e8b'], ['18', '9e4e3e4bf5a29c645f8d2598d73b3325'], ['19', '20e2e431aa1d6817771483c6fc087f91'],
    ['20', 'b42582b6017e7c7c09ffac66ee4e6b6f'],
  ] as const).map(([n, img]): Row => [img, `Nº ${n} · Banho Ouro`, LENS.gold]), { soldOut: true }),
]

export const imgUrl = (src: string) => (src.startsWith('/') ? src : `/${src}.webp`)
export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export const bySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug)
export const siblings = (p: Product) => PRODUCTS.filter((o) => o.categoryId === p.categoryId && o.family === p.family)
export const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
