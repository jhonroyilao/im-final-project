"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, LogIn } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const message = searchParams.get("message")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const validateEmail = (email: string) => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

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
      // Normalize email (trim whitespace and convert to lowercase)
      const normalizedEmail = formData.email.trim().toLowerCase()
      console.log('Attempting to sign in with normalized email:', normalizedEmail)

      // Validate email format
      if (!validateEmail(normalizedEmail)) {
        setError('Please enter a valid email address')
        return
      }

      // First, check if the user exists in our database
      const { data: userData, error: userCheckError } = await supabase
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .single()

      console.log('Initial user check:', { userData, userCheckError })

      if (userCheckError) {
        console.error('Error checking user:', userCheckError)
        setError('User not found in database')
        return
      }

      // Try to sign in with normalized email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      })

      console.log('Auth result:', { authData, authError })

      if (authError) {
        // If sign in fails, try to create a new user
        console.log('Sign in failed, attempting to create new user')
        
        // Create new user in Supabase auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: formData.password,
          options: {
            data: {
              user_id: userData.id,
              role: userData.user_role
            }
          }
        })

        console.log('Sign up result:', { signUpData, signUpError })

        if (signUpError) {
          // Handle specific Supabase error cases
          const errorMessage = signUpError.message || signUpError.toString()
          console.error('Sign up error details:', errorMessage)

          if (errorMessage.toLowerCase().includes('email')) {
            setError('Please enter a valid email address')
          } else if (errorMessage.toLowerCase().includes('password')) {
            setError('Password must be at least 6 characters long')
          } else if (errorMessage.toLowerCase().includes('already registered')) {
            setError('This email is already registered. Please try signing in instead.')
          } else {
            setError('Failed to create account. Please try again later.')
          }
          return
        }

        if (!signUpData.user) {
          setError("No user data returned from sign up")
          return
        }

        // Store user info in localStorage
        localStorage.setItem('userId', userData.id)
        localStorage.setItem('userRole', userData.user_role)
        localStorage.setItem('userName', `${userData.first_name} ${userData.last_name}`)

        // Map numeric role to dashboard path
        const roleMap: Record<number, string> = {
          1: 'admin',
          2: 'faculty',
          3: 'student'
        }
        
        // Ensure user_role is a number
        const userRole = Number(userData.user_role)
        
        if (isNaN(userRole)) {
          console.error('Invalid role value:', userData.user_role)
          setError('Invalid user role format')
          return
        }

        console.log('Parsed user role:', userRole)
        console.log('Role mapping:', {
          userRole: userRole,
          mappedRole: roleMap[userRole]
        })

        const dashboardPath = roleMap[userRole]
        if (!dashboardPath) {
          console.error('Invalid user role number:', userRole)
          setError('Invalid user role')
          return
        }

        console.log('Redirecting to:', `/dashboard/${dashboardPath}`)
        router.push(`/dashboard/${dashboardPath}`)
        return
      }

      if (!authData.user) {
        setError("No user data returned")
        return
      }

      // Get user role and additional info
      const { data: userInfo, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          email,
          user_role,
          first_name,
          last_name,
          userrole!inner (
            role_name
          ),
          Students:students (
            student_number,
            first_name,
            surname
          ),
          Faculty:faculty (
            faculty_number,
            first_name,
            surname
          )
        `)
        .eq('email', normalizedEmail)
        .single()

      console.log('Full user info result:', { userInfo, userError })

      if (userError) {
        console.error('Database error:', userError)
        setError('Failed to fetch user information')
        return
      }

      if (!userInfo) {
        setError("User data not found")
        return
      }

      // Ensure we have a valid role
      if (!userInfo.user_role) {
        console.error('No user role found:', userInfo)
        setError('User role not found')
        return
      }

      console.log('User role from database:', userInfo.user_role)
      console.log('User role details:', userInfo.userrole)

      // Store user info in localStorage
      localStorage.setItem('userId', userInfo.id)
      localStorage.setItem('userRole', userInfo.user_role)
      localStorage.setItem('userName', `${userInfo.first_name} ${userInfo.last_name}`)

      // Map numeric role to dashboard path
      const roleMap: Record<number, string> = {
        1: 'admin',
        2: 'faculty',
        3: 'student'
      }
      
      // Ensure user_role is a number
      const userRole = Number(userInfo.user_role)
      
      if (isNaN(userRole)) {
        console.error('Invalid role value:', userInfo.user_role)
        setError('Invalid user role format')
        return
      }

      console.log('Parsed user role:', userRole)
      console.log('Role mapping:', {
        userRole: userRole,
        mappedRole: roleMap[userRole]
      })

      const dashboardPath = roleMap[userRole]
      if (!dashboardPath) {
        console.error('Invalid user role number:', userRole)
        setError('Invalid user role')
        return
      }

      console.log('Redirecting to:', `/dashboard/${dashboardPath}`)
      router.push(`/dashboard/${dashboardPath}`)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
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
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mx-auto"></div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/auth/register" className="text-primary hover:underline">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <strong>Student:</strong> student@demo.com / student123
                </p>
                <p>
                  <strong>Faculty:</strong> faculty@demo.com / faculty123
                </p>
                <p>
                  <strong>Admin:</strong> admin@demo.com / admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
