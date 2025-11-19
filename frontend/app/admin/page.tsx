"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { apiFetch } from "@/lib/api"

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [form, setForm] = useState({
    title: "",
    author: "",
    price: 0,
    genre: "",
    image: "",
    description: "",
    stock_quantity: 0,
    is_offer: false,
    original_price: "",
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<any | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const profile = await apiFetch('/api/auth/profile')
        setIsAdmin(profile?.user?.role === 'admin')
        if (profile?.user?.role !== 'admin') {
          setLoading(false)
          return
        }
        const prod = await apiFetch('/api/products')
        setProducts(prod.products || [])
        const ord = await apiFetch('/api/orders/admin/all?limit=50')
        setOrders(ord.orders || [])
      } catch {
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function createProduct(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload: any = {
        title: String(form.title || ''),
        author: String(form.author || ''),
        price: Number(form.price ?? 0),
        rating: 0,
        genre: form.genre || null,
        image: form.image || null,
        description: form.description || null,
        stock_quantity: Number(form.stock_quantity ?? 0),
        is_offer: !!form.is_offer,
      }
      if (form.is_offer && form.original_price !== '' && form.original_price !== null) {
        payload.original_price = Number(form.original_price)
      }

      const created = await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      setProducts([created.product, ...products])
      setForm({ title: "", author: "", price: 0, genre: "", image: "", description: "", stock_quantity: 0, is_offer: false, original_price: "" })
      alert('Producto creado')
    } catch (err: any) {
      alert(err?.message || 'No se pudo crear el producto')
    }
  }

  async function startEdit(p: any) {
    setEditingId(p.id)
    setEditForm({
      title: p.title || "",
      author: p.author || "",
      price: p.price ?? 0,
      original_price: p.original_price ?? '',
      rating: p.rating ?? 0,
      genre: p.genre || "",
      image: p.image || "",
      description: p.description || "",
      stock_quantity: p.stock_quantity ?? 0,
      is_offer: !!p.is_offer,
      category_id: p.category_id ?? null,
    })
  }

  async function saveEdit() {
    if (!editingId || !editForm) return
    try {
      const payload: any = {
        title: String(editForm.title || ''),
        author: String(editForm.author || ''),
        price: Number(editForm.price ?? 0),
        rating: Number(editForm.rating ?? 0),
        genre: editForm.genre || null,
        image: editForm.image || null,
        description: editForm.description || null,
        stock_quantity: Number(editForm.stock_quantity ?? 0),
        is_offer: !!editForm.is_offer,
        category_id: editForm.category_id ?? null,
      }
      if (editForm.original_price !== undefined && editForm.original_price !== '' && editForm.original_price !== null) {
        payload.original_price = Number(editForm.original_price)
      }

      const updated = await apiFetch(`/api/products/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      setProducts(products.map(p => p.id === editingId ? updated.product : p))
      setEditingId(null)
      setEditForm(null)
      alert('Producto actualizado')
    } catch (err: any) {
      alert(err?.message || 'No se pudo actualizar el producto')
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm('¿Eliminar este producto?')) return
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' })
      setProducts(products.filter(p => p.id !== id))
      alert('Producto eliminado')
    } catch (err: any) {
      alert(err?.message || 'No se pudo eliminar el producto')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">Cargando…</main>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-xl border-0 shadow-xl bg-white/80 rounded-3xl">
            <CardHeader>
              <CardTitle>No tienes acceso</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Esta sección requiere perfil administrador.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1 border-0 shadow-xl bg-white/80 rounded-3xl">
            <CardHeader>
              <CardTitle>Crear Producto</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createProduct} className="space-y-3">
                <div>
                  <Label>Título</Label>
                  <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Autor</Label>
                  <Input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
                </div>
                <div>
                  <Label>Precio (CLP)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Género</Label>
                  <Input value={form.genre} onChange={e => setForm({ ...form, genre: e.target.value })} />
                </div>
                <div>
                  <Label>Imagen (URL)</Label>
                  <Input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div>
                  <Label>Stock</Label>
                  <Input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: Number(e.target.value) })} />
                </div>
                <div className="flex gap-2 items-center">
                  <input id="is_offer" type="checkbox" checked={form.is_offer} onChange={e => setForm({ ...form, is_offer: e.target.checked })} />
                  <Label htmlFor="is_offer">Oferta</Label>
                </div>
                <Button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-full">Crear</Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-8">
            <Card className="border-0 shadow-xl bg-white/80 rounded-3xl">
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map(p => (
                    <div key={p.id} className="p-4 border rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{p.title}</div>
                          <div className="text-sm text-muted-foreground">{p.author}</div>
                          <Badge variant="outline" className="mt-2">{p.genre}</Badge>
                          {p.is_offer && (
                            <Badge className="mt-2 bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">Oferta</Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${(p.price ?? 0).toLocaleString('es-CL')}</div>
                          {p.original_price && (
                            <div className="text-xs line-through text-muted-foreground">${(p.original_price).toLocaleString('es-CL')}</div>
                          )}
                          <div className="text-sm">Stock: {p.stock_quantity ?? 0}</div>
                        </div>
                      </div>
                      {editingId === p.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label>Precio</Label>
                              <Input type="number" value={editForm?.price ?? 0} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} />
                            </div>
                            <div>
                              <Label>Stock</Label>
                              <Input type="number" value={editForm?.stock_quantity ?? 0} onChange={e => setEditForm({ ...editForm, stock_quantity: Number(e.target.value) })} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <input id={`offer_${p.id}`} type="checkbox" checked={!!editForm?.is_offer} onChange={e => setEditForm({ ...editForm, is_offer: e.target.checked })} />
                            <Label htmlFor={`offer_${p.id}`}>Oferta</Label>
                          </div>
                          {editForm?.is_offer && (
                            <div>
                              <Label>Precio original</Label>
                              <Input type="number" value={editForm?.original_price ?? ''} onChange={e => setEditForm({ ...editForm, original_price: e.target.value === '' ? '' : Number(e.target.value) })} />
                            </div>
                          )}
                          <div>
                            <Label>Descripción</Label>
                            <Textarea value={editForm?.description ?? ''} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={saveEdit} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Guardar</Button>
                            <Button variant="outline" onClick={() => { setEditingId(null); setEditForm(null) }}>Cancelar</Button>
                            <Button className="bg-gradient-to-r from-red-600 to-pink-600 text-white" onClick={() => deleteProduct(p.id)}>Eliminar</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => startEdit(p)}>Editar</Button>
                          <Button className="bg-gradient-to-r from-red-600 to-pink-600 text-white" onClick={() => deleteProduct(p.id)}>Eliminar</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 rounded-3xl">
              <CardHeader>
                <CardTitle>Órdenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.map(o => (
                    <div key={o.id} className="p-4 border rounded-2xl flex justify-between">
                      <div>
                        <div className="font-bold">#{o.order_number}</div>
                        <div className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString('es-CL')}</div>
                      </div>
                      <div className="text-right">
                        <Badge className="capitalize bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0">{o.status}</Badge>
                        <div className="font-bold mt-1">${(o.total_amount ?? 0).toLocaleString('es-CL')}</div>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <div className="text-muted-foreground">No hay órdenes aún</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}