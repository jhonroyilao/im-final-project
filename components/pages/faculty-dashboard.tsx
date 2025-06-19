"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Search } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RoomCalendar from "@/components/calendar/room-calendar"
import ReserveRoomModal from "@/components/reservation/reserve-room-modal"
import FindRoomModal from "@/components/reservation/find-room-modal"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

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
  room: {
    room_number: string;
    room_capacity: number;
  };
}

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("calendar")
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [showFindModal, setShowFindModal] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    const fetchFacultyReservations = async () => {
      try {
        setError(null)
        const userId = localStorage.getItem('userId')
        if (!userId) {
          setError('User ID not found. Please log in again.')
          return
        }
        const { data: reservationData, error: reservationError } = await supabase
          .from('reservation')
          .select(`*, room:room_id (room_number, room_capacity)`)
          .eq('user_id', userId)
          .order('reservation_date', { ascending: true })
        if (reservationError) {
          setError('Failed to load reservations. Please try again.')
          return
        }
        setReservations(reservationData || [])
      } catch (error) {
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchFacultyReservations()
  }, [isClient])

  if (!isClient) {
    return null
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1:
        return <Badge className="bg-green-500">Approved</Badge>
      case 2:
        return <Badge className="bg-red-500">Rejected</Badge>
      case 3:
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 4:
        return <Badge className="bg-gray-500">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>
    }
  }

  const getPriorityLevelText = (priorityLevel: number): string => {
    switch (priorityLevel) {
      case 1:
        return "University and/or College Functions"
      case 2:
        return "Scheduled Regular Classes"
      case 3:
        return "Make-up and Tutorial Classes initiated by Faculty"
      case 4:
        return "Co-curricular Activities"
      default:
        return "Not specified"
    }
  }

  return (
    <DashboardLayout userRole="faculty">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Hello, CCIS Professor!
            </h1>
            <p className="text-gray-600">Manage your lab reservations and class schedules here.</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

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
              <div className="flex gap-2"></div>
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
                      <p className="text-gray-500 mb-4">Start by reserving a room for your classes or research activities.</p>
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
                          <TableHead>Reason</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservations.map((reservation) => (
                          <TableRow key={reservation.reservation_id}>
                            <TableCell>{format(new Date(reservation.reservation_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>
                              {format(new Date(`2000-01-01T${reservation.start_time}`), 'h:mm a')} - {' '}
                              {format(new Date(`2000-01-01T${reservation.end_time}`), 'h:mm a')}
                            </TableCell>
                            <TableCell>
                              Room {reservation.room?.room_number || 'N/A'}
                            </TableCell>
                            <TableCell>{reservation.purpose}</TableCell>
                            <TableCell>{getPriorityLevelText(reservation.priority_level)}</TableCell>
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
        {/* <div className="hidden lg:block border-l bg-gray-50 p-4">
          <ReservationSidebar userRole="faculty" />
        </div> */}
      </div>

      {/* Modals */}
      <ReserveRoomModal open={showReserveModal} onOpenChange={setShowReserveModal} userRole="faculty" />
      <FindRoomModal open={showFindModal} onOpenChange={setShowFindModal} userRole="faculty" />
    </DashboardLayout>
  )
}
