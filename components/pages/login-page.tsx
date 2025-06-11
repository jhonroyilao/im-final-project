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
    // More comprehensive email validation regex
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
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
        console.error('Invalid email format:', normalizedEmail)
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      // Simple query to check if user exists
      const { data: userData, error: userCheckError } = await supabase
        .from('users')
        .select('user_id, email, user_role')
        .eq('email', normalizedEmail)
        .maybeSingle()

      if (userCheckError) {
        console.error('Database error:', userCheckError)
        setError('Error connecting to database')
        return
      }

      if (!userData) {
        console.error('No user found with email:', normalizedEmail)
        setError('User not found')
        return
      }

      console.log('Found user:', userData)

      // Try to sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      })

      if (authError) {
        console.log('Auth error, attempting to create auth user:', authError)
        
        // If sign in fails, try to create the auth user
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password: formData.password,
            options: {
              data: {
                user_id: userData.user_id,
                role: userData.user_role
              }
            }
          })

          if (signUpError) {
            // Log the complete error object
            console.error('Sign up error:', {
              error: signUpError,
              message: signUpError.message,
              status: signUpError.status,
              name: signUpError.name,
              stack: signUpError.stack
            })
            
            // Check if user already exists in auth
            const { data: existingUser } = await supabase.auth.getUser()
            console.log('Existing user check:', existingUser)

            if (existingUser?.user) {
              // User exists in auth, try to sign in again
              console.log('User exists in auth, attempting to sign in...')
              const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password: formData.password,
              })

              if (retryAuthError) {
                console.error('Retry auth error:', retryAuthError)
                setError('Invalid email or password')
                return
              }

              // Store user info
              localStorage.setItem('userId', userData.user_id)
              localStorage.setItem('userRole', userData.user_role)
              
              // Map role to dashboard
              const roleMap: Record<number, string> = {
                1: 'admin',
                2: 'faculty',
                3: 'student'
              }

              const userRole = Number(userData.user_role)
              if (isNaN(userRole)) {
                setError('Invalid user role format')
                return
              }

              const dashboardPath = roleMap[userRole]
              if (!dashboardPath) {
                setError('Invalid user role')
                return
              }

              router.push(`/dashboard/${dashboardPath}`)
              return
            }

            // Handle specific error cases
            if (signUpError.message?.toLowerCase().includes('email')) {
              setError('Invalid email format. Please check your email address.')
            } else if (signUpError.message?.toLowerCase().includes('password')) {
              setError('Password must be at least 6 characters long')
            } else {
              setError('Failed to create account. Please try again.')
            }
            return
          }

          if (!signUpData.user) {
            setError('Failed to create account')
            return
          }

          // Store user info
          localStorage.setItem('userId', userData.user_id)
          localStorage.setItem('userRole', userData.user_role)
          
          // Map role to dashboard
          const roleMap: Record<number, string> = {
            1: 'admin',
            2: 'faculty',
            3: 'student'
          }

          const userRole = Number(userData.user_role)
          if (isNaN(userRole)) {
            setError('Invalid user role format')
            return
          }

          const dashboardPath = roleMap[userRole]
          if (!dashboardPath) {
            setError('Invalid user role')
            return
          }

          router.push(`/dashboard/${dashboardPath}`)
        } catch (signUpErr) {
          console.error('Unexpected error during sign up:', signUpErr)
          setError('An unexpected error occurred during account creation')
          return
        }
      } else {
        // Store user info for existing auth user
        localStorage.setItem('userId', userData.user_id)
        localStorage.setItem('userRole', userData.user_role)
      }
      
      // Map role to dashboard
      const roleMap: Record<number, string> = {
        1: 'admin',
        2: 'faculty',
        3: 'student'
      }

      const userRole = Number(userData.user_role)
      if (isNaN(userRole)) {
        setError('Invalid user role format')
        return
      }

      const dashboardPath = roleMap[userRole]
      if (!dashboardPath) {
        setError('Invalid user role')
        return
      }

      router.push(`/dashboard/${dashboardPath}`)
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred during login')
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
