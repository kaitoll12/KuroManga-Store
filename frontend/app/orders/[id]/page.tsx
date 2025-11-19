"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function OrderDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [order, setOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setIsAuthed(!!token)
    if (!token) { setLoading(false); return }
    const loadOrder = async () => {
      try {
        const data = await apiFetch(`/api/orders/${id}`)
        setOrder(data.order)
      } catch (e) {
        console.error('Error cargando orden', e)
      } finally {
        setLoading(false)
      }
    }
    if (id) loadOrder()
  }, [id])

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <Card className="mx-auto max-w-xl border-0 shadow-xl bg-white/80 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl">Necesitas iniciar sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Inicia sesión para ver el detalle de tu orden.</p>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Ir a autenticación</Button>
              </Link>
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
        <div className="max-w-5xl mx-auto space-y-6">
          {loading || !order ? (
            <p className="text-center">Cargando…</p>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Orden #{order.order_number}
                </h1>
                <p className="text-muted-foreground">Creada el {new Date(order.created_at).toLocaleString('es-CL')}</p>
              </div>

              <Card className="border-0 shadow-xl bg-white/80 rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Estado</CardTitle>
                  <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 capitalize">
                    {order.status}
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección de envío</p>
                    <p className="font-medium">{order.shipping_address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{order.phone}</p>
                  </div>
                  {order.notes && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Notas</p>
                      <p className="font-medium">{order.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/80 rounded-3xl">
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {order.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={item.image || '/placeholder.svg'} alt={item.title} className="w-16 h-20 object-cover rounded-xl" />
                        <div>
                          <p className="font-semibold">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.author}</p>
                          <p className="text-sm">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-purple-600">${(item.price * item.quantity).toLocaleString('es-CL')}</p>
                        <p className="text-sm text-muted-foreground">${(item.price).toLocaleString('es-CL')} c/u</p>
                      </div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${(order.total_amount ?? 0).toLocaleString('es-CL')}</span>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Link href="/orders">
                  <Button variant="outline" className="border-2 border-purple-200 hover:border-purple-500">Volver a órdenes</Button>
                </Link>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Seguir comprando</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}