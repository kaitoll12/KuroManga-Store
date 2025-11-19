"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { apiFetch } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setIsAuthed(!!token)
    if (!token) { setLoading(false); return }
    const loadOrders = async () => {
      try {
        const data = await apiFetch('/api/orders/my-orders')
        setOrders(data.orders || [])
      } catch (e) {
        console.error('Error cargando órdenes', e)
      } finally {
        setLoading(false)
      }
    }
    loadOrders()
  }, [])

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
              <p className="text-muted-foreground">Inicia sesión para ver tus órdenes.</p>
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
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Mis Órdenes</h1>
            <p className="text-muted-foreground">Historial de compras y detalle de cada orden</p>
          </div>

          {loading ? (
            <p className="text-center">Cargando…</p>
          ) : orders.length === 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 rounded-3xl">
              <CardContent className="p-8 text-center">
                <p className="text-lg">No tienes órdenes aún</p>
                <Separator className="my-4" />
                <Link href="/">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Ir al catálogo</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map(order => (
                <Card key={order.id} className="border-0 shadow-xl bg-white/80 rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold">#{order.order_number}</CardTitle>
                    <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 capitalize">
                      {order.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Fecha</p>
                        <p>{new Date(order.created_at).toLocaleString('es-CL')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Items</p>
                        <p>{order.item_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total</p>
                        <p className="font-semibold">${(order.total_amount ?? 0).toLocaleString('es-CL')}</p>
                      </div>
                      <div className="text-right lg:text-left">
                        <Link href={`/orders/${order.id}`}>
                          <Button variant="outline" className="border-2 border-purple-200 hover:border-purple-500">Ver detalle</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}