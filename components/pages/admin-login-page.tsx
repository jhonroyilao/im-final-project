"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    adminId: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
      // Demo admin credentials
      if (formData.adminId === "ADMIN001" && formData.password === "admin123") {
        setTimeout(() => {
          router.push("/dashboard/admin")
        }, 1000)
      } else {
        setError("Invalid admin credentials")
      }
    } catch (err: any) {
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
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
                  placeholder="Enter your admin ID"
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
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Admin Credentials:</h4>
              <div className="text-xs text-gray-600">
                <p>
                  <strong>Admin ID:</strong> ADMIN001
                </p>
                <p>
                  <strong>Password:</strong> admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
