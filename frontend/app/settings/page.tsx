"use client"

import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-2xl border-0 shadow-2xl bg-white/85 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl">Ajustes</CardTitle>
          </CardHeader>
          <CardContent>
            Próximamente: edición de perfil, dirección y preferencias.
          </CardContent>
        </Card>
      </main>
    </div>
  )
}