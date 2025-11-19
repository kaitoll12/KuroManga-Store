"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { apiFetch, clearToken } from "@/lib/api"

export default function AccountPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/auth/profile')
        setUser(data.user)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">Cargando…</main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <Card className="mx-auto max-w-xl border-0 shadow-xl bg-white/80 rounded-3xl text-center">
            <CardHeader>
              <CardTitle>Necesitas iniciar sesión</CardTitle>
            </CardHeader>
            <CardContent>
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
        <div className="max-w-3xl mx-auto">
          <Card className="border-0 shadow-xl bg-white/80 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl">Mi Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-muted-foreground">Usuario</div>
                  <div className="font-semibold">{user.username}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Email</div>
                  <div className="font-semibold">{user.email}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Nombre</div>
                  <div className="font-semibold">{user.full_name ?? '-'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Rol</div>
                  <Badge className="capitalize bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0">{user.role}</Badge>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Link href="/orders">
                  <Button variant="outline" className="border-2 border-purple-200">Ver mis órdenes</Button>
                </Link>
                <Link href="/cart">
                  <Button variant="outline" className="border-2 border-purple-200">Ir al carrito</Button>
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin">
                    <Button className="bg-gradient-to-r from-red-600 to-pink-600 text-white">Panel de administrador</Button>
                  </Link>
                )}
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  onClick={() => { clearToken(); window.location.href = '/' }}
                >
                  Cerrar sesión
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}