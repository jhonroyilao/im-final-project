"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Search } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RoomCalendar from "@/components/calendar/room-calendar"
import ReservationSidebar from "@/components/reservation/reservation-sidebar"
import ReserveRoomModal from "@/components/reservation/reserve-room-modal"
import FindRoomModal from "@/components/reservation/find-room-modal"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface StudentInfo {
  user_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  student_number: string;
  year_level: string;
  section: string;
}

interface Reservation {
  reservation_id: number;
  room_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  purpose: string;
  number_of_students: number;
  equipment_needed: boolean;
  room_status: number;
  priority_level: number;
  approved_by: number | null;
  approved_at: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  Room: {
    room_number: string;
    room_capacity: number;
  };
}

export default function StudentDashboard() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("calendar")
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [showFindModal, setShowFindModal] = useState(false)
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Fetch student information and reservations
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get the current user's ID from localStorage (you should implement proper auth)
        const userId = localStorage.getItem('userId')
        if (!userId) {
          console.error('No user ID found')
          return
        }

        // Fetch student information
        const { data: studentData, error: studentError } = await supabase
          .from('student')
          .select(`
            user_id,
            student_number,
            year_level,
            section,
            Users:user_id (
              first_name,
              middle_name,
              last_name,
              email
            )
          `)
          .eq('user_id', userId)
          .single()

        if (studentError) {
          console.error('Error fetching student data:', studentError)
          return
        }

        if (studentData) {
          setStudentInfo({
            user_id: studentData.user_id,
            first_name: studentData.Users[0].first_name,
            middle_name: studentData.Users[0].middle_name,
            last_name: studentData.Users[0].last_name,
            email: studentData.Users[0].email,
            student_number: studentData.student_number,
            year_level: studentData.year_level,
            section: studentData.section
          })
        }

        // Fetch student's reservations
        const { data: reservationData, error: reservationError } = await supabase
          .from('reservation')
          .select(`
            *,
            Room:room_id (
              room_number,
              room_capacity
            )
          `)
          .eq('user_id', userId)
          .order('reservation_date', { ascending: true })

        if (reservationError) {
          console.error('Error fetching reservations:', reservationError)
          return
        }

        setReservations(reservationData || [])
      } catch (error) {
        console.error('Error in fetchStudentData:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [])

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 2:
        return <Badge className="bg-green-500">Approved</Badge>
      case 3:
        return <Badge className="bg-red-500">Rejected</Badge>
      case 4:
        return <Badge className="bg-gray-500">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  return (
    <DashboardLayout userRole="student">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Hello, {studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : 'CCISkolar'}!
            </h1>
            <p className="text-gray-600">Book your lab reservations here.</p>
          </div>

          <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
            <div className="flex justify-between items-center border-b-2 border-primary pb-2">
              <TabsList className="bg-transparent">
                <TabsTrigger 
                  value="calendar" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="reservations" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">My Reservations</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="find" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Find Room</span>
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex border-primary text-primary hover:bg-primary hover:text-white"
                  onClick={() => setShowFindModal(true)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Room
                </Button>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setShowReserveModal(true)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Reserve Room
                </Button>
              </div>
            </div>

            <TabsContent value="calendar" className="mt-6">
              <RoomCalendar />
            </TabsContent>

            <TabsContent value="reservations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Reservations</CardTitle>
                  <CardDescription>View and manage your lab reservations</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    </div>
                  ) : reservations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations yet</h3>
                      <p className="text-gray-500 mb-4">Start by reserving a room for your projects or study sessions.</p>
                      <Button onClick={() => setShowReserveModal(true)} className="bg-primary hover:bg-primary/90">
                        Reserve a Room
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((reservation) => (
                          <TableRow key={reservation.reservation_id}>
                            <TableCell>{format(new Date(reservation.reservation_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {format(new Date(`2000-01-01T${reservation.start_time}`), 'h:mm a')} - 
                              {format(new Date(`2000-01-01T${reservation.end_time}`), 'h:mm a')}
                            </TableCell>
                            <TableCell>Room {reservation.Room.room_number}</TableCell>
                            <TableCell>{reservation.purpose}</TableCell>
                            <TableCell>{getStatusBadge(reservation.room_status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="find" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Find Available Rooms</CardTitle>
                  <CardDescription>Search for available rooms based on your requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Find the Perfect Room</h3>
                    <p className="text-gray-500 mb-4">Search for rooms based on date, time, and equipment needs.</p>
                    <Button onClick={() => setShowFindModal(true)} className="bg-primary hover:bg-primary/90">
                      <Search className="w-4 h-4 mr-2" />
                      Find Room
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block border-l bg-gray-50 p-4">
          <ReservationSidebar userRole="student" />
        </div>
      </div>

      {/* Modals */}
      <ReserveRoomModal open={showReserveModal} onOpenChange={setShowReserveModal} userRole="student" />
      <FindRoomModal open={showFindModal} onOpenChange={setShowFindModal} />
    </DashboardLayout>
  )
}