"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in (for demo, we'll check localStorage)
    const userRole = localStorage.getItem("userRole")
    
    if (userRole) {
      // Redirect to role-specific dashboard
      router.push(`/dashboard/${userRole}`)
    } else {
      // If no role is found, redirect to login
      router.push("/auth/login")
    }
    
    setLoading(false)
  }, [router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="w-12 h-12 flex items-center justify-center">
            <Image
              src="/PUP_CCIS_logo.png"
              alt="PUP CCIS Logo"
              width={48}
              height={48}
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-ccis-blue">CCIS Lab System</span>
        </div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
} 