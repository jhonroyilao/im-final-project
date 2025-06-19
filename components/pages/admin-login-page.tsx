"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function AdminLoginPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    adminId: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Look up admin by admin_number in admin table, join to users for role check
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('admin_id, user_id, admin_number, admin_password, users:user_id (user_role, is_active)')
        .eq('admin_number', formData.adminId)
        .single()

      if (adminError || !adminData) {
        setError('Invalid admin credentials')
        return
      }

      // Check password (now in admin table)
      if (adminData.admin_password !== formData.password) {
        setError('Invalid admin credentials')
        return
      }

      // Optional: check user_role is 1 (admin)
      let userObj: any = adminData.users;
      if (Array.isArray(userObj)) {
        if (userObj.length === 0) {
          setError('Not an admin account')
          return
        }
        userObj = userObj[0];
      }
      if (userObj && typeof userObj === 'object' && !Array.isArray(userObj)) {
        if (userObj.user_role !== 1) {
          setError('Not an admin account')
          return
        }
        if (userObj.is_active === false) {
          setError('This admin account is inactive')
          return
        }
      }

      // Store adminId and userId
      localStorage.setItem('adminId', adminData.admin_id)
      localStorage.setItem('userId', adminData.user_id)
      localStorage.setItem('userRole', '1')

      // Redirect to admin dashboard
      router.push('/dashboard/admin')
    } catch (err) {
      setError('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/onboarding"
            className="inline-flex items-center space-x-2 mb-6 text-ccis-blue hover:text-ccis-blue/80"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to role selection</span>
          </Link>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h1>
          <p className="text-gray-600">Enter your admin credentials to continue</p>
        </div>

        {/* Admin Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Administrator Login</CardTitle>
            <CardDescription>Secure access for system administrators</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminId">Admin ID</Label>
                <Input
                  id="adminId"
                  name="adminId"
                  type="text"
                  required
                  placeholder="e.g. 01234"
                  value={formData.adminId}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
                {loading ? "Signing In..." : "Sign In as Admin"}
              </Button>
            </form>

            {/* Demo Credentials */}
            
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
