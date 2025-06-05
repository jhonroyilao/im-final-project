"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  Search,
  Bell,
  LogOut,
  Menu,
  Home,
  Package,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "student" | "faculty" | "admin"
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    // In a real app, this would handle logout logic
    router.push("/")
  }

  const userInfo = {
    student: {
      name: "John Smith",
      role: "Student",
      id: "2024-12345",
      color: "bg-ccis-blue",
    },
    faculty: {
      name: "Prof. Maria Garcia",
      role: "Faculty",
      id: "F1234",
      color: "bg-green-600",
    },
    admin: {
      name: "Admin User",
      role: "Administrator",
      id: "ADMIN001",
      color: "bg-purple-600",
    },
  }[userRole]

  const navigationItems = {
    student: [
      { name: "Dashboard", href: "/dashboard/student", icon: Home },
      { name: "Calendar", href: "/dashboard/student?tab=calendar", icon: Calendar },
      { name: "Reservations", href: "/dashboard/student?tab=reserve", icon: Clock },
      { name: "Find Room", href: "/dashboard/student?tab=find", icon: Search },
    ],
    faculty: [
      { name: "Dashboard", href: "/dashboard/faculty", icon: Home },
      { name: "Calendar", href: "/dashboard/faculty?tab=calendar", icon: Calendar },
      { name: "Reservations", href: "/dashboard/faculty?tab=reserve", icon: Clock },
      { name: "Find Room", href: "/dashboard/faculty?tab=find", icon: Search },
    ],
    admin: [
      { name: "Dashboard", href: "/dashboard/admin", icon: BarChart3 },
      { name: "Reservation Requests", href: "/dashboard/admin?tab=requests", icon: Clock },
      { name: "Inventory", href: "/dashboard/admin?tab=inventory", icon: Package },
      { name: "Rooms", href: "/dashboard/admin?tab=rooms", icon: Home },
      { name: "Users", href: "/dashboard/admin?tab=users", icon: Users },
    ],
  }[userRole]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Mobile Menu Button */}
            <div className="flex items-center">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center space-x-2 py-4">
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Image
                          src="/PUP_CCIS_logo.png"
                          alt="PUP CCIS Logo"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xl font-bold text-ccis-blue">CCIS Lab System</span>
                    </div>
                    <nav className="flex-1 pt-4">
                      <ul className="space-y-2">
                        {navigationItems.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className="flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <item.icon className="w-5 h-5 mr-3 text-gray-500" />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                    <div className="border-t py-4">
                      <div className="flex items-center px-3 py-2">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full ${userInfo.color} flex items-center justify-center`}>
                            <span className="text-white font-medium text-sm">{userInfo.name.charAt(0)}</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                          <p className="text-xs text-gray-500">{userInfo.id}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start px-3 py-2 text-gray-700 hover:bg-gray-100 mt-2"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-5 h-5 mr-3 text-gray-500" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Link href={`/dashboard/${userRole}`} className="flex items-center space-x-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image
                    src="/PUP_CCIS_logo.png"
                    alt="PUP CCIS Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
                <span className="text-xl font-bold text-ccis-blue hidden md:inline-block">CCIS Lab System</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 flex items-center"
                >
                  <item.icon className="w-4 h-4 mr-2 text-gray-500" />
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full ${userInfo.color} flex items-center justify-center`}>
                      <span className="text-white font-medium text-sm">{userInfo.name.charAt(0)}</span>
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium text-gray-700">{userInfo.name}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userInfo.name}</p>
                      <p className="text-xs text-gray-500">
                        {userInfo.role} • {userInfo.id}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500">&copy; 2025 BSCS 2-4. All rights reserved.</div>
            <div className="mt-4 md:mt-0 text-sm text-gray-500">
              <Link href="#" className="hover:text-ccis-blue">
                Help
              </Link>
              <span className="mx-2">•</span>
              <Link href="#" className="hover:text-ccis-blue">
                Privacy
              </Link>
              <span className="mx-2">•</span>
              <Link href="#" className="hover:text-ccis-blue">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
