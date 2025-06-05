import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Users, Settings, Bell, Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LandingPage() {
  const features = [
    {
      icon: Calendar,
      title: "Room Reservations",
      description: "Book computer labs for your classes and projects with our intuitive calendar system.",
    },
    {
      icon: Search,
      title: "Smart Room Finder",
      description: "Find available rooms based on your equipment needs and time preferences.",
    },
    {
      icon: Settings,
      title: "Inventory Management",
      description: "Request additional equipment and track inventory usage across all labs.",
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description: "Get instant updates on reservation approvals, rejections, and important announcements.",
    },
    {
      icon: Clock,
      title: "Schedule Integration",
      description: "View pre-scheduled classes and find available time slots effortlessly.",
    },
    {
      icon: Users,
      title: "Role-based Access",
      description: "Tailored dashboards for students, faculty, and administrators.",
    },
  ]

  const teamMembers = [
    {
      name: "Jhon Roy Ilao",
      role: "Frontend Developer",
      image: "/snoopy.jpeg",
      description: "Leading the digital transformation of laboratory management.",
    },
    {
      name: "John Eric Samillano",
      role: "Backend Developer",
      image: "/snoopy.jpeg",
      description: "Ensuring optimal utilization of laboratory resources.",
    },
    {
      name: "Luis Miguel Delacruz",
      role: "Backend Developer",
      image: "/snoopy.jpeg",
      description: "Maintaining and developing the technical infrastructure.",
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 flex items-center justify-center">
                <Image
                  src="/PUP_CCIS_logo.png"
                  alt="PUP CCIS Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-primary">CCIS Lab System</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/onboarding">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                  Sign In
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="absolute inset-0">
          <Image
            src="/pup_pic.jpg"
            alt="PUP Background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-blue-100/90 backdrop-blur-[10px]\"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-secondary text-black hover:bg-secondary/90 border-0">CCIS Department</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              Lab Reservation & Inventory Management System
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-600 leading-relaxed">
              Streamline your laboratory bookings and equipment requests for rooms.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/onboarding">
                <Button size="lg" className="bg-secondary text-black hover:bg-secondary/90 text-lg px-8 py-4">
                  Reserve a Room
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-white text-lg px-8 py-4"
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Lab Management
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive system provides everything you need to efficiently manage laboratory resources and
              reservations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The dedicated professionals behind the CCIS Lab Management System
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <Card key={index} className="text-center border-0 shadow-lg bg-white">
                <CardHeader>
                  <div className="mx-auto mb-4">
                    <Image
                      src={member.image || "/placeholder.svg"}
                      alt={member.name}
                      width={200}
                      height={200}
                      className="rounded-full mx-auto"
                    />
                  </div>
                  <CardTitle className="text-xl text-gray-900">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-semibold">{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join the CCIS community and start managing your laboratory reservations efficiently today.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-secondary text-black hover:bg-secondary/90 text-lg px-8 py-4">
              Start Your Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold">CCIS Lab System</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Streamlining laboratory management for the College of Computer and Information Sciences.
              </p>
              <div className="text-sm text-gray-400">
                <p>College of Computer and Information Sciences</p>
                <p>Polytechnic University of the Philippines</p>
                <p>Email: inquire@pup.edu.ph.</p>
                <p>Phone: (123) 456-7890</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/onboarding" className="hover:text-white transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/onboarding" className="hover:text-white transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Room Schedule
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Equipment List
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    System Status
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BSCS 2-4. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
