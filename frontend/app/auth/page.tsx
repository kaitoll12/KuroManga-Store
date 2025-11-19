"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Navbar } from "@/components/navbar"
import { Eye, EyeOff, User } from 'lucide-react'
import { apiFetch, setToken } from "@/lib/api"
import { useCart } from "@/lib/store"

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [registerData, setRegisterData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { items, clearCart } = useCart()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setLoginErrors({})
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginData)
      })
      if (data?.token) {
        setToken(data.token)
        try {
          for (const item of items) {
            await apiFetch('/api/cart/add', {
              method: 'POST',
              body: JSON.stringify({ product_id: item.id, quantity: item.quantity })
            })
          }
          clearCart()
        } catch {}
        router.push("/")
      }
    } catch (err: any) {
      const message = String(err?.message || "")
      if ((err?.status === 401 || err?.status === 403) && message.toLowerCase().includes("invalid")) {
        setLoginErrors({ email: "Correo o contraseña incorrecta", password: "Correo o contraseña incorrecta", general: "Correo o contraseña incorrecta" })
      } else {
        setLoginErrors({ general: message })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerData.password !== registerData.confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }
    try {
      setLoading(true)
      const payload = {
        username: registerData.username,
        email: registerData.email,
        password: registerData.password,
        full_name: registerData.name,
      }
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      })
      // Si el backend devuelve token al registrarse, guardarlo; si no, redirigir a login
      if (data?.token) {
        setToken(data.token)
        try {
          for (const item of items) {
            await apiFetch('/api/cart/add', {
              method: 'POST',
              body: JSON.stringify({ product_id: item.id, quantity: item.quantity })
            })
          }
          clearCart()
        } catch {}
        router.push("/")
      } else {
        alert("Registro exitoso, ahora inicia sesión")
      }
    } catch (err: any) {
      const details = err?.data?.details as Array<{ msg: string }>
      if (Array.isArray(details) && details.length > 0) {
        alert(`Error al registrarse:\n${details.map(d => `• ${d.msg}`).join('\n')}`)
      } else {
        alert(`Error al registrarse: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl shadow-xl mb-4">
              <User className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              ¡Bienvenido a KuroManga!
            </h1>
            <p className="text-muted-foreground">
              Accede a tu cuenta para disfrutar de mangas impresos en Chile
            </p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border-2 border-purple-100 rounded-2xl p-1">
              <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white font-semibold">
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white font-semibold">
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold text-gray-800">Iniciar Sesión</CardTitle>
                  <CardDescription className="text-gray-600">
                    Ingresa tus credenciales para acceder a tu cuenta
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-6 px-8">
                    <div className="space-y-2">
                      {loginErrors.general && (
                        <p className="text-red-600 text-sm font-semibold">{loginErrors.general}</p>
                      )}
                      <Label htmlFor="login-email" className="text-sm font-semibold text-gray-700">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                        className={`h-12 border-2 ${loginErrors.email ? 'border-red-400 focus:border-red-500' : 'border-purple-100 focus:border-purple-500'} rounded-xl bg-white/50`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-semibold text-gray-700">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Tu contraseña"
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          required
                          className={`h-12 border-2 ${loginErrors.password ? 'border-red-400 focus:border-red-500' : 'border-purple-100 focus:border-purple-500'} rounded-xl bg-white/50 pr-12`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      {loading ? "Ingresando..." : "Iniciar Sesión"}
                    </Button>
                    <Button type="button" variant="link" className="text-sm text-purple-600 hover:text-purple-700">
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-3xl">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold text-gray-800">Crear Cuenta</CardTitle>
                  <CardDescription className="text-gray-600">
                    Regístrate para comenzar a comprar mangas impresos de calidad premium
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-6 px-8">
                    <div className="space-y-2">
                      <Label htmlFor="register-username" className="text-sm font-semibold text-gray-700">Nombre de Usuario</Label>
                      <Input
                        id="register-username"
                        type="text"
                        placeholder="usuario123"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                        required
                        pattern="^[a-zA-Z0-9_]{3,50}$"
                        className="h-12 border-2 border-purple-100 focus:border-purple-500 rounded-xl bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-sm font-semibold text-gray-700">Nombre Completo</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Tu nombre completo"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        required
                        className="h-12 border-2 border-purple-100 focus:border-purple-500 rounded-xl bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-sm font-semibold text-gray-700">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="tu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        required
                        className="h-12 border-2 border-purple-100 focus:border-purple-500 rounded-xl bg-white/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-sm font-semibold text-gray-700">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Mínimo 8 caracteres"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                          required
                          minLength={8}
                          className="h-12 border-2 border-purple-100 focus:border-purple-500 rounded-xl bg-white/50 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm-password" className="text-sm font-semibold text-gray-700">Confirmar Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="register-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirma tu contraseña"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                          required
                          className="h-12 border-2 border-purple-100 focus:border-purple-500 rounded-xl bg-white/50 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-8 pb-8">
                    <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                      {loading ? "Creando cuenta..." : "Crear Cuenta"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
