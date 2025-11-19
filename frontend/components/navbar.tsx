"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, Menu, ShoppingCart, User, Tag, Settings, LogOut, User2 } from 'lucide-react'
import { useCart } from "@/lib/store"
import { clearToken } from "@/lib/api"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { items } = useCart()
  const [isAuthed, setIsAuthed] = useState(false)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    setIsAuthed(!!token)
  }, [])
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const NavLinks = () => (
    <>
      <Link 
        href="/" 
        className="flex items-center gap-2 text-sm font-semibold hover:text-purple-600 transition-colors duration-300 px-4 py-2 rounded-full hover:bg-purple-50"
      >
        <BookOpen className="h-4 w-4" />
        Catálogo
      </Link>
      <Link 
        href="/offers" 
        className="flex items-center gap-2 text-sm font-semibold hover:text-pink-600 transition-colors duration-300 px-4 py-2 rounded-full hover:bg-pink-50"
      >
        <Tag className="h-4 w-4" />
        Ofertas
      </Link>
      <Link 
        href="/cart" 
        className="flex items-center gap-2 text-sm font-semibold hover:text-orange-600 transition-colors duration-300 px-4 py-2 rounded-full hover:bg-orange-50 relative"
      >
        <ShoppingCart className="h-4 w-4" />
        Carrito
        {totalItems > 0 && (
          <Badge className="h-6 w-6 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-red-500 to-pink-500 animate-bounce">
            {totalItems}
          </Badge>
        )}
      </Link>
      {isAuthed && (
        <Link 
          href="/orders" 
          className="flex items-center gap-2 text-sm font-semibold hover:text-purple-600 transition-colors duration-300 px-4 py-2 rounded-full hover:bg-purple-50"
        >
          Mis Órdenes
        </Link>
      )}
    </>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow-lg">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 font-black text-2xl group">
          <img
            src="/logo.png"
            alt="KuroManga Store"
            className="h-12 w-auto rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105"
          />
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            KuroManga Store
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-3">
          {!isAuthed ? (
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                <User className="h-4 w-4 mr-2" />
                Mi Cuenta
              </Button>
            </Link>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-full border-2 border-purple-200 hover:border-purple-500">
                  <Avatar className="mr-2">
                    <AvatarFallback>
                      <User2 className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  Cuenta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Mis Órdenes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Ajustes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    try { clearToken() } catch {}
                    window.location.href = "/"
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden rounded-full border-2 border-purple-200 hover:border-purple-500">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="flex flex-col gap-6 mt-8">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
