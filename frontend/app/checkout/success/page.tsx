"use client"

import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-2xl border-0 shadow-2xl bg-white/85 rounded-3xl text-center">
          <CardHeader>
            <CardTitle className="text-3xl">¡Pago exitoso! 🎉</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Tu pago fue procesado correctamente. En unos instantes verás tu orden creada.
            </p>
            <p className="text-muted-foreground">
              Puedes revisar el detalle en la sección de órdenes.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              <Link href="/orders">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Ver mis órdenes</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="border-2 border-purple-200">Volver al catálogo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}