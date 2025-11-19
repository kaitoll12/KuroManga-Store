"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useCart } from "@/lib/store";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const id = Number(params?.id);
    if (!id || isNaN(id)) return;
    const fetchProduct = async () => {
      try {
        const data = await apiFetch(`/api/products/${id}`);
        setProduct(data.product || data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params?.id]);

  async function handleAdd() {
    if (!product) return;
    try {
      setAdding(true);
      await apiFetch("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({ product_id: Number(product.id), quantity: 1 }),
      });
    } catch (err) {
      addToCart({
        id: product.id,
        title: product.title,
        author: product.author || "",
        price: product.price ?? 0,
        originalPrice: product.original_price,
        rating: product.rating ?? 5,
        genre: product.genre || "",
        image: product.image || product.image_url || "",
      });
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Cargando producto...</p>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>No se encontró el producto.</p>
          <Button onClick={() => router.push("/")}>Volver al catálogo</Button>
        </main>
      </div>
    );
  }

  const inStock = product.inStock !== undefined ? product.inStock : ((product.stock_quantity ?? product.stock ?? 0) > 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 rounded-3xl">
          <CardHeader className="p-0">
            <img
              src={product.image || product.image_url || "/placeholder.svg"}
              alt={product.title}
              className="w-full h-[400px] object-cover"
            />
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <CardTitle className="text-3xl mb-3">{product.title}</CardTitle>
              <p className="text-muted-foreground mb-3 font-medium">por {product.author || "Desconocido"}</p>
              <Badge variant="outline" className="mb-4 border-purple-200 text-purple-700 bg-purple-50">
                {product.genre}
              </Badge>
              <p className="leading-relaxed text-gray-700">
                {product.description || "Manga disponible en impresión de alta calidad."}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-purple-600">
                  {(product.price ?? 0).toLocaleString('es-CL')}
                </span>
                {(product.original_price || product.is_offer) && product.original_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    ${(product.original_price).toLocaleString('es-CL')}
                  </span>
                )}
              </div>
              <Button
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl"
                onClick={handleAdd}
                disabled={!inStock || adding}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {inStock ? (adding ? "Agregando..." : "Agregar al Carrito") : "Agotado"}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="p-6">
            <Button variant="outline" onClick={() => router.push("/")}>Volver</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
