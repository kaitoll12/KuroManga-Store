"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ShoppingCart, Star } from 'lucide-react'
import { Navbar } from "@/components/navbar"
import { useCart } from "@/lib/store"
import Link from "next/link"
import { apiFetch } from "@/lib/api"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/hooks/use-toast"

export default function HomePage() {
  const [mangas, setMangas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [sortBy, setSortBy] = useState("title")
  const { addToCart } = useCart()
  const [addingId, setAddingId] = useState<number | null>(null)
  const [addedId, setAddedId] = useState<number | null>(null)

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        const data = await apiFetch("/api/products")
        setMangas(data.products || [])
      } catch (error) {
        console.error("Error fetching mangas:", error)
      }
    }

    fetchMangas()
  }, [])

  const genres = ["all", ...Array.from(new Set(mangas.map(manga => manga.genre)))]

  const filteredMangas = mangas
    .filter(manga => 
      (manga.title || "").toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedGenre === "all" || manga.genre === selectedGenre)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return b.rating - a.rating
        default:
          return a.title.localeCompare(b.title)
      }
    })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative text-center mb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 opacity-10 rounded-3xl"></div>
          <div className="relative z-10 py-16 px-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-medium mb-6 shadow-lg">
              <span className="animate-pulse">🔥</span>
              ¡Nuevos mangas cada semana!
            </div>
            <img
              src="/logo.png"
              alt="KuroManga Store"
              className="mx-auto h-40 md:h-48 mb-6 drop-shadow-xl"
            />
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Los mejores mangas impresos en Chile con <span className="text-purple-600 font-semibold">calidad premium</span> y envío a todo el país
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 max-w-5xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar tu manga favorito..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg border-2 border-purple-200 focus:border-purple-500 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm"
                />
              </div>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-full md:w-56 h-14 border-2 border-purple-200 focus:border-purple-500 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="Género" />
                </SelectTrigger>
                <SelectContent>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>
                      {genre === "all" ? "🌟 Todos los géneros" : `📚 ${genre}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-56 h-14 border-2 border-purple-200 focus:border-purple-500 rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title">📝 Título A-Z</SelectItem>
                  <SelectItem value="price-low">💰 Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="price-high">💎 Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="rating">⭐ Mejor Valorados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Catálogo Épico ({filteredMangas.length} mangas)
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredMangas.map((manga) => (
              <Card key={manga.id} className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-gray-50 hover:scale-105 hover:-translate-y-2 rounded-3xl">
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <img
                      src={manga.image || manga.image_url || "/placeholder.svg"}
                      alt={manga.title}
                      className="w-full h-72 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {(manga.is_offer || manga.original_price) && (
                      <Badge className="absolute top-4 left-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 text-sm font-bold shadow-lg animate-pulse">
                        🔥 OFERTA
                      </Badge>
                    )}
                    {!((manga.inStock !== undefined ? manga.inStock : ((manga.stock_quantity ?? manga.stock ?? 0) > 0))) && (
                      <Badge variant="secondary" className="absolute top-4 right-4 bg-gray-800 text-white">
                        Agotado
                      </Badge>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2 text-white">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{manga.rating ?? 5}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Link href={`/products/${manga.id}`}>
                    <CardTitle className="text-xl mb-3 line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {manga.title}
                    </CardTitle>
                  </Link>
                  <p className="text-muted-foreground mb-3 font-medium">
                    por {manga.author || manga.author_name || "Desconocido"}
                  </p>
                  <Badge variant="outline" className="mb-4 border-purple-200 text-purple-700 bg-purple-50">
                    {manga.genre}
                  </Badge>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-purple-600">
                      ${(manga.price ?? 0).toLocaleString('es-CL')}
                    </span>
                    {manga.original_price && (
                      <span className="text-lg text-muted-foreground line-through">
                        ${(manga.original_price).toLocaleString('es-CL')}
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                  <Button
                    className={`w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${addedId === manga.id ? 'ring-2 ring-green-400 animate-pulse' : ''}`}
                    onClick={async () => {
                      try {
                        setAddingId(manga.id)
                        // Intentar agregar a carrito vía backend si hay token; si no, fallback local
                        await apiFetch("/api/cart/add", {
                          method: "POST",
                          body: JSON.stringify({ product_id: Number(manga.id), quantity: 1 })
                        })
                        setAddedId(manga.id)
                        toast({ title: 'Agregado al carrito', description: manga.title })
                      } catch (err) {
                        // Fallback al carrito local si no autenticado o error
                        addToCart({
                          id: manga.id,
                          title: manga.title,
                          author: manga.author || "",
                          price: manga.price ?? 0,
                          originalPrice: manga.original_price,
                          rating: manga.rating ?? 5,
                          genre: manga.genre || "",
                          image: manga.image || manga.image_url || "",
                        })
                        setAddedId(manga.id)
                        toast({ title: 'Agregado al carrito', description: manga.title })
                      } finally {
                        setAddingId(null)
                        setTimeout(() => setAddedId(null), 1000)
                      }
                    }}
                    disabled={!((manga.inStock !== undefined ? manga.inStock : ((manga.stock_quantity ?? manga.stock ?? 0) > 0))) || addingId === manga.id}
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {((manga.inStock !== undefined ? manga.inStock : ((manga.stock_quantity ?? manga.stock ?? 0) > 0))) ? (addingId === manga.id ? "Agregando..." : (addedId === manga.id ? "✅ Agregado" : "Agregar al Carrito")) : "Agotado"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {filteredMangas.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-xl text-muted-foreground">
                No se encontraron mangas con los filtros seleccionados.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
