"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { Navbar } from "@/components/navbar"
import { useCart } from "@/lib/store"
import { apiFetch } from "@/lib/api"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart()
  const [remoteItems, setRemoteItems] = useState<any[]>([])
  const [remoteTotal, setRemoteTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [shippingAddress, setShippingAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    setIsAuthed(!!token)
    if (!token) {
      setLoading(false)
      return
    }
    const loadCart = async () => {
      try {
        const data = await apiFetch('/api/cart')
        setRemoteItems(data.cart?.items || [])
        setRemoteTotal(data.cart?.total || 0)
      } catch (e) {
        console.error('Error cargando carrito remoto', e)
        // Si el token expiró o es inválido, limpiar y seguir con carrito local
        try { localStorage.removeItem('token') } catch {}
        setIsAuthed(false)
      } finally {
        setLoading(false)
      }
    }
    loadCart()
  }, [])

  async function remoteUpdateQuantity(cartItemId: number, productId: number, quantity: number) {
    try {
      const data = await apiFetch(`/api/cart/update/${cartItemId}`, {
        method: 'PUT',
        body: JSON.stringify({ product_id: productId, quantity })
      })
      setRemoteItems(data.cart.items)
      setRemoteTotal(data.cart.total)
    } catch (e: any) {
      alert(`No se pudo actualizar: ${e.message}`)
    }
  }

  async function remoteRemove(cartItemId: number) {
    try {
      const data = await apiFetch(`/api/cart/remove/${cartItemId}`, { method: 'DELETE' })
      setRemoteItems(data.cart.items)
      setRemoteTotal(data.cart.total)
    } catch (e: any) {
      alert(`No se pudo eliminar: ${e.message}`)
    }
  }

  async function remoteClear() {
    try {
      const data = await apiFetch('/api/cart/clear', { method: 'DELETE' })
      setRemoteItems([])
      setRemoteTotal(0)
    } catch (e: any) {
      alert(`No se pudo vaciar el carrito: ${e.message}`)
    }
  }

  async function handleCheckoutSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!isAuthed) {
      alert('Debes iniciar sesión para completar la compra')
      router.push('/auth')
      return
    }
    if (!shippingAddress.trim()) {
      alert('Por favor ingresa tu dirección de envío')
      return
    }
    if (!phone.trim()) {
      alert('Por favor ingresa tu teléfono de contacto')
      return
    }
    try {
      setCheckoutLoading(true)
      const data = await apiFetch('/api/checkout/session', {
        method: 'POST',
        body: JSON.stringify({
          shipping_address: shippingAddress,
          phone,
          notes: notes || undefined,
        })
      })

      if (data?.url) {
        window.location.href = data.url
        return
      }

      alert('No se pudo iniciar el pago')
    } catch (err: any) {
      alert(err?.message || 'No se pudo iniciar el pago')
    } finally {
      setCheckoutLoading(false)
    }
  }

  const displayItems = isAuthed ? remoteItems : items
  const totalLocal = getTotalPrice()
  const displayTotal = isAuthed ? remoteTotal : totalLocal

  if (!loading && displayItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl mb-8">
              <ShoppingBag className="h-16 w-16 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Tu carrito está vacío
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto">
              ¡Descubre mangas increíbles y llena tu carrito de aventuras épicas!
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                🚀 Explorar Catálogo
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🛒 Carrito de Compras
            </h1>
            <p className="text-lg text-muted-foreground">
              Revisa tus mangas seleccionados - Impresión y envío desde Chile
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {displayItems.map((item: any, index: number) => (
                <Card key={item.cart_item_id ?? item.id ?? `${item.product_id}-${index}`} className="border-0 shadow-xl bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex gap-6">
                      <div className="relative">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="w-24 h-32 object-cover rounded-2xl shadow-lg"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {item.quantity}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
                            <p className="text-muted-foreground font-medium">{item.author}</p>
                            <Badge className="mt-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0">
                              {item.genre}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => isAuthed ? remoteRemove(item.cart_item_id ?? item.id) : removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => isAuthed 
                                ? remoteUpdateQuantity(item.cart_item_id ?? item.id, item.product_id ?? item.id, Math.max(0, item.quantity - 1))
                                : updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                              className="rounded-full border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-bold text-lg">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => isAuthed 
                                ? remoteUpdateQuantity(item.cart_item_id ?? item.id, item.product_id ?? item.id, item.quantity + 1)
                                : updateQuantity(item.id, item.quantity + 1)}
                              className="rounded-full border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="text-right">
                            <div className="font-bold text-xl text-purple-600">
                              ${((item.price ?? item.original_price ?? 0) * item.quantity).toLocaleString('es-CL')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              ${(item.price ?? item.original_price ?? 0).toLocaleString('es-CL')} c/u
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50 rounded-3xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <CardTitle className="text-2xl font-bold text-center">💎 Resumen del Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-8">
                  {(() => {
                    const vat = Math.round(displayTotal * 0.19)
                    const totalWithVat = displayTotal + vat
                    return (
                      <>
                        <div className="flex justify-between text-lg">
                          <span>Subtotal</span>
                          <span className="font-semibold">${displayTotal.toLocaleString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span>Envío a Chile</span>
                          <span className="font-semibold text-green-600">¡Gratis! 🇨🇱</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span>IVA (19%)</span>
                          <span className="font-semibold">${vat.toLocaleString('es-CL')}</span>
                        </div>
                        <Separator className="bg-gradient-to-r from-purple-200 to-pink-200 h-0.5" />
                        <div className="flex justify-between font-bold text-2xl text-purple-600">
                          <span>Total</span>
                          <span>${totalWithVat.toLocaleString('es-CL')}</span>
                        </div>
                      </>
                    )
                  })()}
                </CardContent>
                <CardFooter className="flex flex-col gap-4 p-8 pt-0">
                  <Button 
                    className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300" 
                    onClick={() => {
                      if (!isAuthed) {
                        alert('Debes iniciar sesión para comprar')
                        router.push('/auth')
                        return
                      }
                      setCheckoutOpen(true)
                    }}
                  >
                    🚀 Proceder al Pago
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-2 border-purple-200 hover:border-purple-500 hover:bg-purple-50 rounded-2xl font-semibold" 
                    onClick={() => isAuthed ? remoteClear() : clearCart()}
                  >
                    🗑️ Vaciar Carrito
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Finalizar compra</DialogTitle>
            <DialogDescription>
              Ingresa tus datos de envío para crear tu orden.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCheckoutSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shipping_address">Dirección de envío</Label>
              <Textarea
                id="shipping_address"
                placeholder="Calle, número, comuna, ciudad, región"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Instrucciones especiales, horario de entrega, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCheckoutOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={checkoutLoading} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                {checkoutLoading ? 'Procesando…' : 'Crear orden'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
