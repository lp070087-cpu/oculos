'use client'

import { useState } from 'react'
import { CATEGORIES, brl, imgUrl, normalize, type Product } from '@/lib/catalog'
import { catalog, demo } from '@/lib/demo/store'
import { toast } from '@/lib/ui'
import { Modal, Pill } from '@/components/ui'
import type { DemoState } from '@/lib/demo/types'

export function Products({ s }: { s: DemoState }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [edit, setEdit] = useState<Product | null>(null)
  const [create, setCreate] = useState(false)
  const all = catalog(s)
  const list = all.filter((p) => (!cat || p.categoryId === cat) && normalize(p.name).includes(normalize(q)) && (!lowOnly || (s.stock[p.slug] ?? 0) <= s.lowStockAt))
  const low = all.filter((p) => !p.soldOut && (s.stock[p.slug] ?? 0) <= s.lowStockAt).length
  return (
    <>
      <header className="app-top">
        <div><h1>Produtos e estoque</h1><p>Nomes, preços e fotos da loja. Quantidades em estoque são fictícias.</p></div>
        <div className="app-actions"><button className="btn btn-sm" onClick={() => setCreate(true)}>Novo produto</button></div>
      </header>
      <div className="kpis">
        <div className="kpi"><span>Produtos</span><b>{all.length}</b></div>
        <div className="kpi"><span>Categorias</span><b>{CATEGORIES.length}</b></div>
        <div className="kpi"><span>Estoque baixo</span><b>{low}</b></div>
        <div className="kpi"><span>Esgotados</span><b>{all.filter((p) => (s.stock[p.slug] ?? 0) === 0).length}</b></div>
      </div>
      <div className="toolbar">
        <input className="input" placeholder="Buscar produto" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar produto" />
        <select className="input" style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Estoque baixo</label>
      </div>
      <section className="panel">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Produto</th><th>Categoria</th><th className="num">Preço</th><th>Estoque</th><th /></tr></thead>
            <tbody>
              {list.map((p) => {
                const q = s.stock[p.slug] ?? 0
                return (
                  <tr key={p.slug}>
                    <td><span className="prod-cell"><img src={imgUrl(p.image)} alt="" loading="lazy" /><span>{p.name}</span></span></td>
                    <td>{CATEGORIES.find((c) => c.id === p.categoryId)?.label}</td>
                    <td className="num">{brl(p.price)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="number" min={0} className="input" style={{ width: 80, minHeight: 36, padding: '4px 8px' }} value={q} onChange={(e) => demo.setStock(p.slug, Number(e.target.value))} aria-label={`Estoque de ${p.name}`} />
                        {q === 0 ? <Pill tone="bad">Esgotado</Pill> : q <= s.lowStockAt ? <Pill tone="warn">Baixo</Pill> : null}
                      </div>
                    </td>
                    <td className="num"><button className="text-btn" onClick={() => setEdit(p)}>Editar</button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      {edit && <Editor p={edit} onClose={() => setEdit(null)} />}
      {create && <Creator onClose={() => setCreate(false)} />}
    </>
  )
}

function Editor({ p, onClose }: { p: Product; onClose: () => void }) {
  const [name, setName] = useState(p.name)
  const [price, setPrice] = useState(String(p.price))
  const [old, setOld] = useState(p.oldPrice ? String(p.oldPrice) : '')
  const [categoryId, setCategory] = useState(p.categoryId)
  const [image, setImage] = useState(imgUrl(p.image))
  const pick = (file?: File) => {
    if (!file) return
    const r = new FileReader()
    r.onload = () => setImage(String(r.result))
    r.readAsDataURL(file)
  }
  return (
    <Modal title="Editar produto" onClose={onClose}>
      <form className="stack" onSubmit={(e) => {
        e.preventDefault()
        demo.patchProduct(p.slug, { name, price: Number(price), oldPrice: old ? Number(old) : null, categoryId, image })
        toast('Produto atualizado na demonstração')
        onClose()
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <img src={image} alt="" style={{ width: 96, height: 96, objectFit: 'cover' }} />
          <label className="btn btn-ghost btn-sm">Trocar imagem<input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} /></label>
        </div>
        <label className="field"><span>Nome</span><input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <label className="field"><span>Preço (R$)</span><input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} required /></label>
          <label className="field"><span>Preço anterior (R$)</span><input type="number" step="0.01" min="0" value={old} onChange={(e) => setOld(e.target.value)} /></label>
        </div>
        <label className="field"><span>Categoria</span>
          <select value={categoryId} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        </label>
        <div className="app-actions">
          <button className="btn">Salvar</button>
          <button type="button" className="btn btn-ghost" onClick={() => { demo.patchProduct(p.slug, { hidden: true }); toast('Produto ocultado'); onClose() }}>Ocultar da loja</button>
        </div>
      </form>
    </Modal>
  )
}

function Creator({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ name: '', price: '', stock: '12', categoryId: CATEGORIES[0].id })
  return (
    <Modal title="Novo produto" onClose={onClose}>
      <form className="stack" onSubmit={(e) => {
        e.preventDefault()
        demo.createProduct({ name: f.name, categoryId: f.categoryId, price: Number(f.price), stock: Number(f.stock), image: CATEGORIES.find((c) => c.id === f.categoryId)!.image })
        toast('Produto criado na demonstração')
        onClose()
      }}>
        <label className="field"><span>Nome</span><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></label>
        <div className="form-grid" style={{ marginTop: 0 }}>
          <label className="field"><span>Preço (R$)</span><input type="number" step="0.01" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></label>
          <label className="field"><span>Estoque inicial</span><input type="number" min="0" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} required /></label>
        </div>
        <label className="field"><span>Categoria</span>
          <select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
        </label>
        <div><button className="btn">Criar produto</button></div>
      </form>
    </Modal>
  )
}
