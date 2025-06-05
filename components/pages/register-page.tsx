"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Users, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "student"

  const [formData, setFormData] = useState({
    // Common fields
    firstName: "",
    middleName: "",
    surname: "",
    email: "",
    password: "",
    confirmPassword: "",
    // Role-specific fields
    studentNumber: "",
    facultyNumber: "",
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

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      // Demo mode - simulate successful registration
      setTimeout(() => {
        router.push("/auth/login?message=Registration successful! Please sign in. (Demo Mode)")
      }, 1000)
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "An error occurred during registration")
    } finally {
      setLoading(false)
    }
  }

  const roleConfig = {
    student: {
      title: "Student Registration",
      description: "Create your student account to start reserving labs",
      icon: GraduationCap,
      color: "text-blue-600",
    },
    faculty: {
      title: "Faculty Registration",
      description: "Create your faculty account to manage lab reservations",
      icon: Users,
      color: "text-green-600",
    },
  }

  const config = roleConfig[role as keyof typeof roleConfig]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
              <config.icon className={`w-8 h-8 ${config.color}`} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">{config.title}</h1>
          <p className="text-gray-600">{config.description}</p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Fill in your information to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Role-specific ID field */}
              {role === "student" && (
                <div className="space-y-2">
                  <Label htmlFor="studentNumber">Student Number *</Label>
                  <Input
                    id="studentNumber"
                    name="studentNumber"
                    type="text"
                    required
                    maxLength={15}
                    placeholder="e.g., 2024-12345"
                    value={formData.studentNumber}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {role === "faculty" && (
                <div className="space-y-2">
                  <Label htmlFor="facultyNumber">Faculty Number *</Label>
                  <Input
                    id="facultyNumber"
                    name="facultyNumber"
                    type="text"
                    required
                    maxLength={5}
                    placeholder="e.g., F1234"
                    value={formData.facultyNumber}
                    onChange={handleInputChange}
                  />
                </div>
              )}

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Surname *</Label>
                  <Input
                    id="surname"
                    name="surname"
                    type="text"
                    required
                    value={formData.surname}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  name="middleName"
                  type="text"
                  value={formData.middleName}
                  onChange={handleInputChange}
                />
              </div>

              {/* Email and Password */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>

              <Button type="submit" className="w-full bg-ccis-blue hover:bg-ccis-blue/90" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-ccis-blue hover:underline font-medium">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
