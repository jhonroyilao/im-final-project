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
import { supabase } from "@/lib/supabase"
import { PostgrestError } from "@supabase/supabase-js"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "student"

  // Map role names to role IDs
  const roleIdMap = {
    student: 3,
    faculty: 2,
    admin: 1
  }

  // Map department names to match database
  const departmentMap = {
    "Computer Science": "Department of Computer Science",
    "Information Technology": "Department of Information and Technology"
  }

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
    contactNumber: "",
    department: "",
    section: "",
    year: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
      // Get the department_id based on the department name
      const mappedDepartment = departmentMap[formData.department as keyof typeof departmentMap]
      console.log("Looking up department:", mappedDepartment)

      // First, let's check what departments exist in the database
      const { data: allDepartments, error: deptListError } = await supabase
        .from('department')
        .select('department_id, department_name')

      if (deptListError) {
        console.error("Error fetching departments:", deptListError)
        throw new Error("Failed to fetch departments list")
      }

      console.log("Available departments:", allDepartments)
      console.log("Looking for department:", mappedDepartment)

      // Now try to find the specific department
      const { data: deptData, error: deptError } = await supabase
        .from('department')
        .select('department_id')
        .eq('department_name', mappedDepartment)

      if (deptError) {
        console.error("Department lookup error:", {
          error: deptError,
          department: mappedDepartment,
          availableDepartments: allDepartments
        })
        throw new Error(`Failed to find department: ${deptError.message}`)
      }

      if (!deptData || deptData.length === 0) {
        console.error("Department not found. Available departments:", allDepartments)
        throw new Error(`Department not found: ${mappedDepartment}. Available departments: ${JSON.stringify(allDepartments)}`)
      }

      // Use the first matching department
      const selectedDepartment = deptData[0]
      console.log("Found department:", selectedDepartment)

      // Create user record in Users table
      const userData = {
        user_role: roleIdMap[role as keyof typeof roleIdMap],
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.surname,
        department: selectedDepartment.department_id,
        email: formData.email,
        contact_number: formData.contactNumber,
        password: formData.password,
        is_active: true
      }

      console.log("Creating user with data:", { ...userData, password: '[REDACTED]' })

      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single()

      if (userError) {
        console.error("User creation error:", {
          error: userError,
          userData: { ...userData, password: '[REDACTED]' }
        })
        throw new Error(`Failed to create user: ${userError.message}`)
      }

      if (!newUser) {
        throw new Error("User creation succeeded but no user data returned")
      }

      console.log("Created user:", { ...newUser, password: '[REDACTED]' })

      // If user is a student, create student record
      if (role === 'student') {
        const studentData = {
          user_id: newUser.user_id,
          student_number: formData.studentNumber,
          year_level: formData.year,
          section: formData.section
        }

        console.log("Creating student record:", studentData)

        const { error: studentError } = await supabase
          .from('student')
          .insert([studentData])

        if (studentError) {
          console.error("Student record creation error:", {
            error: studentError,
            studentData
          })
          throw new Error(`Failed to create student record: ${studentError.message}`)
        }
      }

      // If user is faculty, create faculty record
      if (role === 'faculty') {
        const facultyData = {
          user_id: newUser.user_id,
          faculty_number: formData.facultyNumber
        }

        console.log("Creating faculty record:", facultyData)

        const { error: facultyError } = await supabase
          .from('faculty')
          .insert([facultyData])

        if (facultyError) {
          console.error("Faculty record creation error:", {
            error: facultyError,
            facultyData
          })
          throw new Error(`Failed to create faculty record: ${facultyError.message}`)
        }
      }

      // Redirect to login page with success message
      router.push("/auth/login?message=Registration successful! Please sign in.")
    } catch (err) {
      console.error("Registration error:", {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      
      if (err instanceof PostgrestError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An error occurred during registration. Please try again.")
      }
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-indigo-100 flex items-center justify-center p-4">
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
                    placeholder="e.g., 2023-12345-MN-0"
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
                    placeholder="e.g., 01234"
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
                <Label htmlFor="contactNumber">Contact Number *</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  required
                  placeholder="e.g., 09123456789"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <select
                  id="department"
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                </select>
              </div>

              {/* Student-specific fields */}
              {role === "student" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year Level *</Label>
                    <select
                      id="year"
                      name="year"
                      required
                      value={formData.year}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select Year Level</option>
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">Section *</Label>
                    <Input
                      id="section"
                      name="section"
                      type="text"
                      required
                      maxLength={10}
                      placeholder="e.g., BSCS 2-4, BSIT 1-1"
                      value={formData.section}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}

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
