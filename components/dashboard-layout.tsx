"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { LayoutDashboard, Users, CreditCard, Settings, LogOut, Menu, X } from "lucide-react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    document.cookie = "supabase-auth-session=; path=/; max-age=0"
    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    })
    router.push("/")
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "Users", icon: Users },
    { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile menu button */}
      <div className="flex items-center justify-between border-b p-4 md:hidden">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? "block" : "hidden"} w-full border-r bg-muted/40 md:block md:w-64`}>
        <div className="flex h-full flex-col">
          <div className="hidden items-center border-b p-4 md:flex">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t p-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
    </div>
  )
}

