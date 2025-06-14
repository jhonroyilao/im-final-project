"use client"

import type React from "react"

import { useState, useEffect } from "react"
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
import { supabase } from "@/lib/supabase"

interface DashboardLayoutProps {
  children: React.ReactNode
  userRole: "student" | "faculty" | "admin"
}

interface UserInfo {
  name: string
  role: string
  id: string
  color: string
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    name: "Loading...",
    role: userRole.charAt(0).toUpperCase() + userRole.slice(1),
    id: "Loading...",
    color: userRole === "faculty" ? "bg-green-600" : "bg-ccis-blue"
  })

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Get user ID from localStorage
        const userId = localStorage.getItem('userId')
        if (!userId) {
          console.error("No user ID found in localStorage")
          router.push("/auth/login")
          return
        }

        // Fetch user details from the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (userError) {
          console.error("Error fetching user data:", userError)
          router.push("/auth/login")
          return
        }

        if (!userData) {
          console.error("No user data found")
          router.push("/auth/login")
          return
        }

        // Verify user role matches the expected role
        const storedRole = localStorage.getItem('userRole')
        if (!storedRole || Number(storedRole) !== userData.user_role) {
          console.error("User role mismatch")
          router.push("/auth/login")
          return
        }

        // Fetch role-specific information
        if (userRole === 'student') {
          const { data: studentData, error: studentError } = await supabase
            .from('student')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (studentError) {
            console.error("Error fetching student data:", studentError)
            router.push("/auth/login")
            return
          }

          if (!studentData) {
            console.error("No student data found")
            router.push("/auth/login")
            return
          }

          setUserInfo({
            name: `${userData.first_name} ${userData.last_name}`,
            role: "Student",
            id: studentData.student_number,
            color: "bg-ccis-blue"
          })
        } else if (userRole === 'faculty') {
          const { data: facultyData, error: facultyError } = await supabase
            .from('faculty')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (facultyError) {
            console.error("Error fetching faculty data:", facultyError)
            router.push("/auth/login")
            return
          }

          if (!facultyData) {
            console.error("No faculty data found")
            router.push("/auth/login")
            return
          }

          setUserInfo({
            name: `${userData.first_name} ${userData.last_name}`,
            role: "Faculty",
            id: facultyData.faculty_number,
            color: "bg-green-600"
          })
        } else if (userRole === 'admin') {
          setUserInfo({
            name: `${userData.first_name} ${userData.last_name}`,
            role: "Administrator",
            id: "ADMIN",
            color: "bg-ccis-blue"
          })
        }
      } catch (error) {
        console.error("Error fetching user info:", error)
        router.push("/auth/login")
      }
    }

    fetchUserInfo()
  }, [userRole, router])

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('userId')
      localStorage.removeItem('userRole')
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navigationItems = {
    student: [
      { name: "Dashboard", href: "/dashboard/student", icon: Home },
      { name: "Calendar", href: "/dashboard/student?tab=calendar", icon: Calendar },
      { name: "Reservations", href: "/dashboard/student?tab=reservations", icon: Clock }, 
      { name: "Find Room", href: "/dashboard/student?tab=find", icon: Search },
    ],
    faculty: [
      { name: "Dashboard", href: "/dashboard/faculty", icon: Home },
      { name: "Calendar", href: "/dashboard/faculty?tab=calendar", icon: Calendar },
      { name: "Reservations", href: "/dashboard/faculty?tab=reservations", icon: Clock }, 
      { name: "Find Room", href: "/dashboard/faculty?tab=find", icon: Search },
    ],
    admin: [
    
    ],
  }[userRole]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-indigo-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b sticky top-0 z-30 backdrop-blur-xl outline outline-2 outline-gray-200">
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
            <div className="flex items-center space-x-">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full ${userInfo.color} flex items-center justify-center`}>
                      <span className="text-white font-medium text-sm">{userInfo.name.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">{userInfo.name}</span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{userInfo.name}</p>
                      <p className="text-xs text-gray-500">{userInfo.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

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
