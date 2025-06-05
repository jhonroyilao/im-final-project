"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const router = useRouter()

  const roles = [
    {
      id: "student",
      title: "Student",
      description: "Reserve labs for projects and study sessions",
      icon: GraduationCap,
      color: "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      id: "faculty",
      title: "Faculty",
      description: "Book labs for classes and research activities",
      icon: Users,
      color: "border-green-200 hover:border-green-400 hover:bg-green-50",
      iconColor: "text-green-600",
    },
    {
      id: "admin",
      title: "Admin",
      description: "Manage reservations and system administration",
      icon: Shield,
      color: "border-purple-200 hover:border-purple-400 hover:bg-purple-50",
      iconColor: "text-purple-600",
    },
  ]

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId)
  }

  const handleContinue = () => {
    if (selectedRole === "admin") {
      router.push("/auth/admin-login")
    } else {
      router.push(`/auth/register?role=${selectedRole}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
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
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Welcome to CCIS Lab Management</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose your role to get started with the laboratory reservation system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {roles.map((role) => (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all duration-200 ${role.color} ${
                selectedRole === role.id ? "ring-2 ring-ccis-blue shadow-lg scale-105" : "hover:shadow-md"
              }`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardHeader className="text-center pb-4">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-sm flex items-center justify-center`}
                >
                  <role.icon className={`w-8 h-8 ${role.iconColor}`} />
                </div>
                <CardTitle className="text-xl text-gray-900">{role.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-gray-600">{role.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            size="lg"
            className="bg-ccis-blue hover:bg-ccis-blue/90 text-white px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue as {selectedRole ? roles.find((r) => r.id === selectedRole)?.title : "User"}
          </Button>

          <div className="mt-6 text-sm text-gray-500">
            <p>
              Already have an account?{" "}
              <Link href="/auth/login" className="text-ccis-blue hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text */}
       
      </div>
    </div>
  )
}
