"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Search, BookOpen } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RoomCalendar from "@/components/calendar/room-calendar"
import ReserveRoomModal from "@/components/reservation/reserve-room-modal"
import FindRoomModal from "@/components/reservation/find-room-modal"
import { supabase } from "@/lib/supabase"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { X, Filter } from "lucide-react"

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

interface ScheduledClass {
  scheduled_class_id: number;
  room_id: number;
  section?: string;
  instructor_name: number;
  day_of_week: number;
  time_start: string;
  time_end: string;
  semester: string;
  academic_year: string;
  course_code?: string;
  Room?: {
    room_number: string;
  };
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("calendar")
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [showFindModal, setShowFindModal] = useState(false)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  // Filtering states for scheduled classes
  const [scheduledDay, setScheduledDay] = useState<string>('all')
  const [scheduledSection, setScheduledSection] = useState<string>('')
  const [scheduledCourse, setScheduledCourse] = useState<string>('')

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

  // Fetch scheduled classes for this faculty
  useEffect(() => {
    if (!isClient) return;
    const fetchScheduledClasses = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        // Get faculty_id for this user
        const { data: faculty, error: facultyError } = await supabase
          .from('faculty')
          .select('faculty_id')
          .eq('user_id', userId)
          .single();
        if (facultyError || !faculty) return;
        const facultyId = faculty.faculty_id;
        // Now fetch scheduled classes for this faculty_id
        const { data: classData, error: classError } = await supabase
          .from('scheduledclass')
          .select('scheduled_class_id, room_id, section, instructor_name, day_of_week, time_start, time_end, semester, academic_year, course_code, Room:room_id (room_number)')
          .eq('instructor_name', facultyId);
        if (classError) return;
        setScheduledClasses(
          (classData || []).map((cls: any) => ({
            ...cls,
            Room: Array.isArray(cls.Room) ? (cls.Room[0] || undefined) : (cls.Room || undefined)
          }))
        );
      } catch (error) {
        // ignore
      }
    };
    fetchScheduledClasses();
  }, [isClient]);

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
                  value="scheduled" 
                  className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Scheduled Classes</span>
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

            <TabsContent value="scheduled" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Scheduled Classes</CardTitle>
                    <CardDescription>View your scheduled classes for the semester</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="border-gray-300">
                          <Filter className="w-4 h-4 mr-2" />
                          Filter
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="p-2 space-y-2">
                          <div>
                            <Label className="text-xs">Day</Label>
                            <Select
                              value={scheduledDay}
                              onValueChange={setScheduledDay}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Days</SelectItem>
                                {DAY_NAMES.map((day, idx) => (
                                  <SelectItem key={day} value={String(idx)}>{day}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">Section</Label>
                            <Input
                              value={scheduledSection}
                              onChange={e => setScheduledSection(e.target.value)}
                              placeholder="Section..."
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Course Code</Label>
                            <Input
                              value={scheduledCourse}
                              onChange={e => setScheduledCourse(e.target.value)}
                              placeholder="Course code..."
                              className="h-8"
                            />
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setScheduledDay('all');
                            setScheduledSection('');
                            setScheduledCourse('');
                          }}
                          className="text-center justify-center"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Clear Filters
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filtered Table */}
                  {(() => {
                    const filtered = scheduledClasses.filter(cls => {
                      const matchDay = scheduledDay === 'all' || String(cls.day_of_week) === scheduledDay;
                      const matchSection = !scheduledSection || (cls.section || '').toLowerCase().includes(scheduledSection.toLowerCase());
                      const matchCourse = !scheduledCourse || (cls.course_code || '').toLowerCase().includes(scheduledCourse.toLowerCase());
                      return matchDay && matchSection && matchCourse;
                    });
                    if (filtered.length === 0) {
                      return (
                        <div className="text-center py-12 text-gray-500">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled classes</h3>
                          <p className="text-gray-500 mb-4">You have no scheduled classes for this semester.</p>
                        </div>
                      );
                    }
                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Room</TableHead>
                            <TableHead>Day</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Course Code</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filtered.map((cls) => (
                            <TableRow key={cls.scheduled_class_id}>
                              <TableCell>{cls.Room?.room_number || "N/A"}</TableCell>
                              <TableCell>{DAY_NAMES[cls.day_of_week]}</TableCell>
                              <TableCell>{cls.time_start.slice(0, 5)} - {cls.time_end.slice(0, 5)}</TableCell>
                              <TableCell>{cls.section || "-"}</TableCell>
                              <TableCell>{cls.course_code || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
                  })()}
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
