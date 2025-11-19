"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Star, Clock } from 'lucide-react'
import { Navbar } from "@/components/navbar"
import { useCart } from "@/lib/store"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"
import { useRouter } from "next/navigation"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"

interface OfferItem {
  id: number
  title: string
  author: string
  price: number
  originalPrice: number
  rating: number
  genre: string
  image: string
  inStock: boolean
  timeLeft?: string
}

export default function OffersPage() {
  const { addToCart } = useCart()
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addedId, setAddedId] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const data = await apiFetch("/api/products?limit=100")
        const products = (data.products || []).filter((p: any) => p.is_offer || p.original_price)
        const mapped: OfferItem[] = products.map((p: any) => ({
          id: p.id,
          title: p.title,
          author: p.author,
          price: p.price ?? 0,
          originalPrice: p.original_price ?? p.price ?? 0,
          rating: p.rating ?? 5,
          genre: p.genre || "",
          image: p.image || "/placeholder.svg",
          inStock: (p.stock_quantity ?? 0) > 0,
        }))
        setOffers(mapped)
      } catch (e) {
        console.error("Error fetching offers:", e)
      }
    }
    fetchOffers()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster />
      <Toaster />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative text-center mb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-pink-500 to-orange-500 opacity-15 rounded-3xl"></div>
          <div className="relative z-10 py-16 px-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-full text-lg font-bold mb-6 shadow-xl animate-pulse">
              <span className="text-2xl">🔥</span>
              ¡OFERTAS LIMITADAS!
            </div>
            <img
              src="/logo.png"
              alt="KuroManga Store"
              className="mx-auto h-40 md:h-48 mb-6 drop-shadow-xl"
            />
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Los mejores descuentos en mangas impresos en Chile por <span className="text-red-600 font-bold">tiempo limitado</span>
            </p>
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-8 rounded-3xl max-w-3xl mx-auto shadow-2xl">
              <h2 className="text-3xl font-black mb-4">⚡ OFERTAS FLASH ⚡</h2>
              <p className="text-xl font-semibold">Mangas a $4.990 - Calidad premium, impresión chilena</p>
              <div className="mt-4 text-lg">
                <span className="animate-pulse">🇨🇱 Envío gratis a todo Chile</span>
              </div>
            </div>
          </div>
        </section>

        {/* Offers Grid */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">
              Ofertas Activas ({offers.length} productos)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {offers.map((manga) => (
              <Card key={manga.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-red-50 hover:scale-105 hover:-translate-y-2 rounded-3xl border-2 border-red-100">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <img
                      src={manga.image || "/placeholder.svg"}
                      alt={manga.title}
                      className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {manga.originalPrice > manga.price && (
                      <Badge className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 text-lg font-black shadow-xl animate-bounce">
                        🔥 -{Math.max(0, Math.round(100 * (1 - (manga.price / Math.max(1, manga.originalPrice)))))}%
                      </Badge>
                    )}
                    <div className="absolute top-4 right-4 bg-black/90 text-white px-3 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                      <Clock className="h-4 w-4 animate-pulse" />
                      {manga.timeLeft || "Tiempo limitado"}
                    </div>
                    {!manga.inStock && (
                      <Badge variant="secondary" className="absolute bottom-4 right-4 bg-gray-800 text-white px-3 py-1">
                        Agotado
                      </Badge>
                    )}
                    <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 text-white">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{manga.rating}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <CardTitle className="text-xl mb-3 line-clamp-2 group-hover:text-red-600 transition-colors font-bold">
                    {manga.title}
                  </CardTitle>
                  <p className="text-muted-foreground mb-3 font-medium">
                    por {manga.author}
                  </p>
                  <Badge className="mb-4 bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-0 font-semibold">
                    {manga.genre}
                  </Badge>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-black text-red-600">
                      ${manga.price.toLocaleString('es-CL')}
                    </span>
                    {manga.originalPrice > manga.price && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${manga.originalPrice.toLocaleString('es-CL')}
                      </span>
                    )}
                  </div>
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-2 rounded-xl">
                    <p className="text-sm text-green-700 font-bold">
                      💰 Ahorras ${(manga.originalPrice - manga.price).toLocaleString('es-CL')}
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    className={`w-full h-14 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${addedId === manga.id ? 'ring-2 ring-green-400 animate-pulse' : ''}`}
                    onClick={async () => {
                      try {
                        setAddingId(manga.id)
                        await apiFetch('/api/cart/add', {
                          method: 'POST',
                          body: JSON.stringify({ product_id: Number(manga.id), quantity: 1 })
                        })
                        setAddedId(manga.id)
                        toast({ title: 'Agregado al carrito', description: manga.title })
                      } catch (err) {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
                        if (token) {
                          alert((err as any)?.message || 'No se pudo agregar al carrito')
                        } else {
                          addToCart({
                            id: manga.id,
                            title: manga.title,
                            author: manga.author,
                            price: manga.price,
                            originalPrice: manga.originalPrice,
                            rating: manga.rating,
                            genre: manga.genre,
                            image: manga.image,
                          })
                          setAddedId(manga.id)
                          toast({ title: 'Agregado al carrito', description: manga.title })
                        }
                      } finally {
                        setAddingId(null)
                        setTimeout(() => setAddedId(null), 1000)
                      }
                    }}
                    disabled={!manga.inStock || addingId === manga.id}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {manga.inStock ? (addingId === manga.id ? "Agregando..." : (addedId === manga.id ? "✅ Agregado" : "¡Agregar Ahora!")) : "Agotado"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="mt-20 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-12 rounded-3xl text-center text-white shadow-2xl">
          <div className="max-w-2xl mx-auto">
            <div className="text-6xl mb-6">📧</div>
            <h3 className="text-4xl font-black mb-4">¡No te pierdas nada!</h3>
            <p className="text-xl mb-8 opacity-90">
              Suscríbete y recibe notificaciones de ofertas exclusivas, nuevos lanzamientos y descuentos especiales en mangas impresos en Chile
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-6 py-4 border-0 rounded-2xl text-gray-800 font-medium text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-white/30"
              />
              <Button className="bg-white text-purple-600 hover:bg-gray-100 font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg">
                🚀 Suscribirse
              </Button>
            </div>
            <p className="text-sm mt-4 opacity-75">
              ✨ Sin spam, solo las mejores ofertas
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
