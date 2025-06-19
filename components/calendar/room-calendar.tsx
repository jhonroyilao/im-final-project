"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, CalendarIcon, Search, Plus } from "lucide-react"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
} from "date-fns"
import { supabase } from "@/lib/supabase"
import FindRoomModal from "@/components/reservation/find-room-modal"
import ReserveRoomModal from "@/components/reservation/reserve-room-modal"

type RoomCalendarProps = {
  userRole?: "student" | "faculty" | "admin"
}

interface ScheduledClass {
  scheduled_class_id: number
  room_id: number
  section: string
  instructor_name: number
  day_of_week: number
  time_start: string
  time_end: string
  semester: string
  academic_year: string
  course_code: string
  max_student: number
  created_at: string
  updated_at: string
  Room?: {
    room_number: string
    room_capacity: number
  }
  Faculty?: {
    faculty_number: string
    Users?: {
      first_name: string
      last_name: string
    }
  }
}

interface Reservation {
  reservation_id: number
  user_id: number
  room_id: number
  reservation_date: string
  start_time: string
  end_time: string
  room_status: number
  approved_by: number | null
  approved_at: string | null
  created_at: string
  purpose?: string
  users?: {
    first_name: string
    middle_name: string
    last_name: string
    email: string
  }
  room?: {
    room_number: string
  }
}

const rooms = [
  { id: 1, name: "S501", description: "" },
  { id: 2, name: "S502", description: "" },
  { id: 3, name: "S503", description: "" },
  { id: 4, name: "S504", description: "" },
  { id: 5, name: "S505", description: "" },
  { id: 6, name: "S506", description: "" },
  { id: 7, name: "S507", description: "" },
  { id: 8, name: "S508", description: "" },
  { id: 9, name: "S509", description: "" },
]

// Generate time slots with 30-minute intervals from 7:00 AM to 7:00 PM
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 7; hour <= 19; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00:00`)
    if (hour < 19) {
      slots.push(`${hour.toString().padStart(2, "0")}:30:00`)
    }
  }
  return slots
}

const timeSlots = generateTimeSlots()

// Helper function to convert time string to minutes from start of day
const timeToMinutes = (timeStr: string): number => {
  const timeParts = timeStr.split(":")
  const hours = Number.parseInt(timeParts[0])
  const minutes = Number.parseInt(timeParts[1])
  return hours * 60 + minutes
}

// Helper function to get the position and height of a class block
const getClassBlockStyle = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const duration = endMinutes - startMinutes

  // Each 30-minute slot is 60px high, starting from 7:00 AM
  const slotHeight = 60
  const dayStartMinutes = 7 * 60 // 7:00 AM in minutes

  // Calculate how many 30-minute slots from the start of day
  const slotsFromStart = (startMinutes - dayStartMinutes) / 30
  const durationInSlots = duration / 30

  const top = slotsFromStart * slotHeight
  const height = durationInSlots * slotHeight

  return {
    top: `${top}px`,
    height: `${height}px`,
  }
}

// Helper function to format time for display
const formatTimeDisplay = (timeStr: string): string => {
  if (!timeStr) return ""
  const timeParts = timeStr.split(":")
  const hours = Number.parseInt(timeParts[0])
  const minutes = timeParts[1]
  const ampm = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes} ${ampm}`
}

const getReservationColor = (status: number) => {
  if (status === 1) return "bg-blue-200 border-blue-400 text-blue-800" // Approved
  if (status === 2) return "bg-red-200 border-red-400 text-red-800" // Rejected
  if (status === 3) return "bg-yellow-200 border-yellow-400 text-yellow-800" // Pending
  if (status === 4) return "bg-gray-200 border-gray-400 text-gray-800" // Cancelled
  return "bg-gray-200 border-gray-400 text-gray-800" // Default
}

export default function RoomCalendar({ userRole = "student" }: RoomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"today" | "week" | "month">("today")
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [findRoomModalOpen, setFindRoomModalOpen] = useState(false)
  const [reserveRoomModalOpen, setReserveRoomModalOpen] = useState(false)

  const navigateDate = (direction: "prev" | "next") => {
    if (view === "today") {
      setCurrentDate((prev) => (direction === "next" ? addDays(prev, 1) : addDays(prev, -1)))
    } else if (view === "week") {
      setCurrentDate((prev) => (direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)))
    } else if (view === "month") {
      setCurrentDate((prev) => (direction === "next" ? addMonths(prev, 1) : subMonths(prev, 1)))
    }
  }

  const getDateRange = () => {
    if (view === "today") {
      return [currentDate]
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      return eachDayOfInterval({ start, end })
    }
  }

  const getDisplayTitle = () => {
    if (view === "today") {
      return format(currentDate, "EEEE, MMMM d, yyyy")
    } else if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`
    } else {
      return format(currentDate, "MMMM yyyy")
    }
  }

  const dateRange = getDateRange()

  const getClassColor = (section: string) => {
    return "bg-red-200 border-red-400 text-red-800"
  }

  useEffect(() => {
    const fetchScheduledClasses = async () => {
      try {
        console.log("Attempting to fetch scheduled classes...")

        const { data, error } = await supabase
          .from("scheduledclass")
          .select(`
            scheduled_class_id,
            room_id,
            section,
            instructor_name,
            day_of_week,
            time_start,
            time_end,
            semester,
            academic_year,
            course_code,
            max_student,
            created_at,
            updated_at,
            Room:room_id (
              room_number,
              room_capacity
            ),
            Faculty:instructor_name (
              faculty_number,
              Users:user_id (
                first_name,
                last_name
              )
            )
          `)
          .eq("semester", "Second Semester")
          .eq("academic_year", "2024-2025")

        if (error) {
          console.error("Error fetching scheduled classes:", error)
          return
        }

        if (!data || data.length === 0) {
          console.log("No scheduled classes found for the current semester")
          setScheduledClasses([])
          return
        }

        const transformedData: ScheduledClass[] = data.map((item) => ({
          scheduled_class_id: item.scheduled_class_id,
          room_id: item.room_id,
          section: item.section,
          instructor_name: item.instructor_name,
          day_of_week: item.day_of_week,
          time_start: item.time_start,
          time_end: item.time_end,
          semester: item.semester,
          academic_year: item.academic_year,
          course_code: item.course_code,
          max_student: item.max_student,
          created_at: item.created_at,
          updated_at: item.updated_at,
          Room: item.Room?.[0],
          Faculty: item.Faculty?.[0]
            ? {
                ...item.Faculty[0],
                Users: item.Faculty[0].Users?.[0],
              }
            : undefined,
        }))

        console.log("Transformed data:", transformedData)
        setScheduledClasses(transformedData)
      } catch (error) {
        console.error("Unexpected error in fetchScheduledClasses:", error)
      }
    }

    const fetchReservations = async () => {
      try {
        console.log("Fetching reservations...")

        // Get current date range for the view
        const dates = getDateRange()
        const dateStrings = dates.map((date) => format(date, "yyyy-MM-dd"))

        const { data, error } = await supabase
          .from("reservation")
          .select(`
            *,
            users:user_id (
              first_name,
              middle_name,
              last_name,
              email
            ),
            room:room_id (
              room_number
            )
          `)
          .in("reservation_date", dateStrings)
          .in("room_status", [3, 1]) // Pending (3) or approved (1)

        if (error) throw error
        console.log("Fetched reservations:", data)
        setReservations(data || [])
      } catch (error) {
        console.error("Error fetching reservations:", error)
      }
    }

    fetchScheduledClasses()
    fetchReservations()
  }, [currentDate, view])

  const getScheduledClassesForRoom = (roomId: string, date: Date) => {
    const room = rooms.find((r) => r.name === roomId)
    if (!room) return []

    const jsDayOfWeek = date.getDay()
    const dbDayOfWeek = jsDayOfWeek === 0 ? 7 : jsDayOfWeek

    const classes = scheduledClasses.filter(
      (cls) => cls.room_id === room.id && cls.day_of_week === dbDayOfWeek
    )

    return classes
  }

  const getReservationsForRoom = (roomId: string, date: Date) => {
    const room = rooms.find((r) => r.name === roomId)
    if (!room) return []

    const dateString = format(date, "yyyy-MM-dd")

    const roomReservations = reservations.filter(
      (res) => res.room_id === room.id && res.reservation_date === dateString,
    )

    return roomReservations
  }

  const handleReservationComplete = () => {
    // Refresh reservations after a new one is created
    const fetchReservations = async () => {
      try {
        const dates = getDateRange()
        const dateStrings = dates.map((date) => format(date, "yyyy-MM-dd"))

        const { data, error } = await supabase
          .from("reservation")
          .select(`
            *,
            users:user_id (
              first_name,
              middle_name,
              last_name,
              email
            ),
            room:room_id (
              room_number
            )
          `)
          .in("reservation_date", dateStrings)
          .in("room_status", [3, 1])

        if (error) throw error
        setReservations(data || [])
      } catch (error) {
        console.error("Error fetching reservations:", error)
      }
    }

    fetchReservations()
  }

  const TodayView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[1000px] grid grid-cols-10 gap-0 text-sm">
        {/* Header */}
        <div className="p-3 font-medium text-gray-600 border-b border-r bg-gray-50 sticky left-0 z-20">Time</div>
        {rooms.map((room) => (
          <div key={room.id} className="p-3 font-medium text-center border-b border-r bg-gray-50">
            <div className="font-semibold">{room.name}</div>
          </div>
        ))}

        {/* Time slots with class blocks */}
        <div className="contents">
          {/* Time column */}
          <div className="relative border-r bg-white sticky left-0 z-20">
            {timeSlots.map((time, index) => (
              <div key={time} className="relative font-medium h-[60px] text-blue-950">
                <span
                  className={`absolute -top-3 ${time.endsWith(":30") ? "text-xs text-gray-400 left-4" : "text-sm left-2"}`}
                >
                  {time.endsWith(":30") ? time.slice(0, -3) + ":30" : time.slice(0, -3)}
                </span>
              </div>
            ))}
          </div>

          {/* Room columns */}
          {rooms.map((room) => (
            <div key={room.id} className="relative border-r">
              {/* Time slot grid background */}
              {timeSlots.map((time, index) => (
                <div
                  key={`${time}-${room.id}`}
                  className={`h-[60px] border-b ${
                    time.endsWith(":30") ? "border-dashed border-gray-200" : "border-gray-300"
                  } hover:bg-blue-50 cursor-pointer transition-colors`}
                />
              ))}

              {/* Class blocks overlay */}
              {getScheduledClassesForRoom(room.name, currentDate).map((scheduledClass, index) => {
                const style = getClassBlockStyle(scheduledClass.time_start, scheduledClass.time_end)
                const colorClass = getClassColor(scheduledClass.section)

                return (
                  <div
                    key={scheduledClass.scheduled_class_id}
                    className={`absolute left-1 right-1 rounded-md border-2 p-2 ${colorClass} shadow-sm overflow-hidden`}
                    style={{
                      ...style,
                      zIndex: 10 + index, // Ensure each class has a different z-index
                      left: index > 0 ? `${4 + index * 2}px` : "4px", // Offset overlapping classes slightly
                    }}
                    title={`${scheduledClass.section} - ${scheduledClass.course_code} (${scheduledClass.time_start.slice(0, 5)} - ${scheduledClass.time_end.slice(0, 5)})`}
                  >
                    <div className="font-semibold text-xs leading-tight mb-1">{scheduledClass.section}</div>
                    <div className="text-xs leading-tight mb-1">{scheduledClass.course_code}</div>
                    <div className="text-xs leading-tight opacity-75">
                      {scheduledClass.time_start.slice(0, 5)} - {scheduledClass.time_end.slice(0, 5)}
                    </div>
                  </div>
                )
              })}

              {/* Reservation blocks overlay */}
              {getReservationsForRoom(room.name, currentDate).map((reservation, index) => {
                const style = getClassBlockStyle(reservation.start_time, reservation.end_time)
                const colorClass = getReservationColor(reservation.room_status)

                return (
                  <div
                    key={reservation.reservation_id}
                    className={`absolute left-1 right-1 rounded-md border-2 p-2 ${colorClass} shadow-sm overflow-hidden`}
                    style={{
                      ...style,
                      zIndex: 20 + index, // Higher z-index than classes
                      left: index > 0 ? `${4 + index * 2}px` : "4px", // Offset overlapping reservations slightly
                    }}
                    title={`Reservation: ${reservation.users?.first_name} ${reservation.users?.last_name} (${reservation.start_time.slice(0, 5)} - ${reservation.end_time.slice(0, 5)})`}
                  >
                    <div className="font-semibold text-xs leading-tight mb-1">
                      {reservation.room_status === 3 ? "Pending" : "Reserved"}
                    </div>
                    <div className="text-xs leading-tight mb-1">
                      {reservation.users?.first_name} {reservation.users?.last_name}
                    </div>
                    <div className="text-xs leading-tight opacity-75">
                      {reservation.start_time.slice(0, 5)} - {reservation.end_time.slice(0, 5)}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const WeekView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[1200px]">
        {/* Days header */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="p-2 font-medium text-gray-600 bg-gray-50 border rounded">Time</div>
          {dateRange.slice(0, 7).map((date) => (
            <div
              key={date.toISOString()}
              className={`p-2 text-center border rounded ${
                isSameDay(date, new Date()) ? "bg-blue-50 border-blue-300" : "bg-gray-50"
              }`}
            >
              <div className="font-semibold">{format(date, "EEE")}</div>
              <div className={`text-sm ${isSameDay(date, new Date()) ? "text-blue-700 font-bold" : "text-gray-600"}`}>
                {format(date, "MMM d")}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {/* Morning time slots (7:00 - 12:00) */}
          <div className="text-sm font-medium text-gray-700 mb-1">Morning</div>
          <div className="grid grid-cols-8 gap-1">
            <div className="p-2 bg-gray-50 border rounded font-medium">7:00 - 12:00</div>
            {dateRange.slice(0, 7).map((date) => (
              <div key={date.toISOString()} className="border rounded p-2 bg-white">
                <div className="space-y-2">
                  {rooms.map((room) => {
                    const morningClasses = getScheduledClassesForRoom(room.name, date).filter(
                      (cls) => timeToMinutes(cls.time_start) < 12 * 60,
                    )

                    const morningReservations = getReservationsForRoom(room.name, date).filter(
                      (res) => timeToMinutes(res.start_time) < 12 * 60,
                    )

                    if (morningClasses.length === 0 && morningReservations.length === 0) return null

                    return (
                      <div key={`${date.toISOString()}-${room.id}-morning`} className="border-b pb-1 last:border-b-0">
                        <div className="font-medium text-xs text-gray-700">{room.name}</div>

                        {/* Classes */}
                        {morningClasses.map((cls) => (
                          <div
                            key={cls.scheduled_class_id}
                            className="bg-red-100 border border-red-300 rounded p-1 mt-1 text-xs"
                          >
                            <div className="font-medium">{cls.section}</div>
                            <div>{cls.course_code}</div>
                            <div className="text-gray-600">
                              {formatTimeDisplay(cls.time_start)} - {formatTimeDisplay(cls.time_end)}
                            </div>
                          </div>
                        ))}

                        {/* Reservations */}
                        {morningReservations.map((res) => (
                          <div
                            key={res.reservation_id}
                            className={`border rounded p-1 mt-1 text-xs ${
                              res.room_status === 1 ? "bg-blue-100 border-blue-300" : "bg-yellow-100 border-yellow-300"
                            }`}
                          >
                            <div className="font-medium">{res.room_status === 1 ? "Reserved" : "Pending"}</div>
                            <div>
                              {res.users?.first_name} {res.users?.last_name}
                            </div>
                            <div className="text-gray-600">
                              {formatTimeDisplay(res.start_time)} - {formatTimeDisplay(res.end_time)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Afternoon time slots (12:00 - 17:00) */}
          <div className="text-sm font-medium text-gray-700 mb-1 mt-4">Afternoon</div>
          <div className="grid grid-cols-8 gap-1">
            <div className="p-2 bg-gray-50 border rounded font-medium">12:00 - 17:00</div>
            {dateRange.slice(0, 7).map((date) => (
              <div key={date.toISOString()} className="border rounded p-2 bg-white">
                <div className="space-y-2">
                  {rooms.map((room) => {
                    const afternoonClasses = getScheduledClassesForRoom(room.name, date).filter(
                      (cls) => timeToMinutes(cls.time_start) >= 12 * 60 && timeToMinutes(cls.time_start) < 17 * 60,
                    )

                    const afternoonReservations = getReservationsForRoom(room.name, date).filter(
                      (res) => timeToMinutes(res.start_time) >= 12 * 60 && timeToMinutes(res.start_time) < 17 * 60,
                    )

                    if (afternoonClasses.length === 0 && afternoonReservations.length === 0) return null

                    return (
                      <div key={`${date.toISOString()}-${room.id}-afternoon`} className="border-b pb-1 last:border-b-0">
                        <div className="font-medium text-xs text-gray-700">{room.name}</div>

                        {/* Classes */}
                        {afternoonClasses.map((cls) => (
                          <div
                            key={cls.scheduled_class_id}
                            className="bg-red-100 border border-red-300 rounded p-1 mt-1 text-xs"
                          >
                            <div className="font-medium">{cls.section}</div>
                            <div>{cls.course_code}</div>
                            <div className="text-gray-600">
                              {formatTimeDisplay(cls.time_start)} - {formatTimeDisplay(cls.time_end)}
                            </div>
                          </div>
                        ))}

                        {/* Reservations */}
                        {afternoonReservations.map((res) => (
                          <div
                            key={res.reservation_id}
                            className={`border rounded p-1 mt-1 text-xs ${
                              res.room_status === 1 ? "bg-blue-100 border-blue-300" : "bg-yellow-100 border-yellow-300"
                            }`}
                          >
                            <div className="font-medium">{res.room_status === 1 ? "Reserved" : "Pending"}</div>
                            <div>
                              {res.users?.first_name} {res.users?.last_name}
                            </div>
                            <div className="text-gray-600">
                              {formatTimeDisplay(res.start_time)} - {formatTimeDisplay(res.end_time)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Evening time slots (17:00 - 19:00) */}
          <div className="text-sm font-medium text-gray-700 mb-1 mt-4">Evening</div>
          <div className="grid grid-cols-8 gap-1">
            <div className="p-2 bg-gray-50 border rounded font-medium">17:00 - 19:00</div>
            {dateRange.slice(0, 7).map((date) => (
              <div key={date.toISOString()} className="border rounded p-2 bg-white">
                <div className="space-y-2">
                  {rooms.map((room) => {
                    const eveningClasses = getScheduledClassesForRoom(room.name, date).filter(
                      (cls) => timeToMinutes(cls.time_start) >= 17 * 60,
                    )

                    const eveningReservations = getReservationsForRoom(room.name, date).filter(
                      (res) => timeToMinutes(res.start_time) >= 17 * 60,
                    )

                    if (eveningClasses.length === 0 && eveningReservations.length === 0) return null

                    return (
                      <div key={`${date.toISOString()}-${room.id}-evening`} className="border-b pb-1 last:border-b-0">
                        <div className="font-medium text-xs text-gray-700">{room.name}</div>

                        {/* Classes */}
                        {eveningClasses.map((cls) => (
                          <div
                            key={cls.scheduled_class_id}
                            className="bg-red-100 border border-red-300 rounded p-1 mt-1 text-xs"
                          >
                            <div className="font-medium">{cls.section}</div>
                            <div>{cls.course_code}</div>
                            <div className="text-gray-600">
                              {formatTimeDisplay(cls.time_start)} - {formatTimeDisplay(cls.time_end)}
                            </div>
                          </div>
                        ))}

                        {/* Reservations */}
                        {eveningReservations.map((res) => (
                          <div
                            key={res.reservation_id}
                            className={`border rounded p-1 mt-1 text-xs ${
                              res.room_status === 1 ? "bg-blue-100 border-blue-300" : "bg-yellow-100 border-yellow-300"
                            }`}
                          >
                            <div className="font-medium">{res.room_status === 1 ? "Reserved" : "Pending"}</div>
                            <div>
                              {res.users?.first_name} {res.users?.last_name}
                            </div>
                            <div className="text-gray-600">
                              {formatTimeDisplay(res.start_time)} - {formatTimeDisplay(res.end_time)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const MonthView = () => {
    const weeks = eachWeekOfInterval(
      {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      },
      { weekStartsOn: 1 },
    )

    return (
      <div className="space-y-4">
        {/* Month calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50 border rounded">
              {day}
            </div>
          ))}

          {weeks.map((week) => {
            const days = eachDayOfInterval({
              start: week,
              end: addDays(week, 6),
            })

            return days.map((date) => {
              // Group classes by room
              const classesByRoom: Record<string, ScheduledClass[]> = {}
              const reservationsByRoom: Record<string, Reservation[]> = {}

              rooms.forEach((room) => {
                const roomClasses = getScheduledClassesForRoom(room.name, date)
                const roomReservations = getReservationsForRoom(room.name, date)

                if (roomClasses.length > 0) {
                  classesByRoom[room.name] = roomClasses
                }

                if (roomReservations.length > 0) {
                  reservationsByRoom[room.name] = roomReservations
                }
              })

              const hasClasses = Object.keys(classesByRoom).length > 0
              const hasReservations = Object.keys(reservationsByRoom).length > 0

              return (
                <div
                  key={date.toISOString()}
                  className={`p-2 min-h-[120px] border rounded hover:bg-blue-50 cursor-pointer transition-colors ${
                    isSameDay(date, new Date()) ? "bg-blue-100 border-blue-300" : ""
                  } ${date.getMonth() !== currentDate.getMonth() ? "text-gray-400 bg-gray-50" : ""}`}
                >
                  <div className="font-medium text-sm mb-2 flex justify-between items-center">
                    <span className={isSameDay(date, new Date()) ? "text-blue-700 font-bold" : ""}>
                      {format(date, "d")}
                    </span>
                    <div className="flex space-x-1">
                      {hasClasses && (
                        <span className="bg-red-100 text-red-800 text-xs px-1 rounded-full">
                          {Object.values(classesByRoom).flat().length}
                        </span>
                      )}
                      {hasReservations && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-1 rounded-full">
                          {Object.values(reservationsByRoom).flat().length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Room summaries */}
                  <div className="space-y-1">
                    {Object.entries(classesByRoom).map(([roomName, classes]) => (
                      <div key={`${date.toISOString()}-${roomName}-classes`} className="text-xs">
                        <div className="font-medium bg-gray-100 px-1 rounded">{roomName}</div>
                        <div className="pl-1">
                          {classes.length === 1 ? (
                            <div className="text-xs truncate">{classes[0].section}</div>
                          ) : (
                            <div className="text-xs">{classes.length} classes</div>
                          )}
                        </div>
                      </div>
                    ))}

                    {Object.entries(reservationsByRoom).map(([roomName, reservations]) => (
                      <div key={`${date.toISOString()}-${roomName}-reservations`} className="text-xs">
                        <div className="font-medium bg-blue-50 px-1 rounded">{roomName}</div>
                        <div className="pl-1">
                          {reservations.length === 1 ? (
                            <div className="text-xs truncate">
                              {reservations[0].users?.first_name} {reservations[0].users?.last_name}
                            </div>
                          ) : (
                            <div className="text-xs">{reservations.length} reservations</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })
          })}
        </div>

        {/* Room usage summary */}
        <div className="border rounded p-4 bg-gray-50">
          <h3 className="text-sm font-medium mb-2">Room Usage Summary</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {rooms.map((room) => {
              // Count classes for this room in the current month
              const classCount = scheduledClasses.filter((cls) => cls.room_id === room.id).length

              // Count reservations for this room in the current month
              const reservationCount = reservations.filter((res) => res.room_id === room.id).length

              return (
                <div key={room.id} className="flex items-center space-x-2 text-sm">
                  <div
                    className={`w-3 h-3 ${classCount > 0 || reservationCount > 0 ? "bg-blue-400" : "bg-gray-300"} rounded`}
                  ></div>
                  <span>{room.name}</span>
                  <span className="text-xs text-gray-500">({classCount + reservationCount})</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Room Calendar</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">View and manage room reservations</p>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center space-x-1"
              onClick={() => setFindRoomModalOpen(true)}
            >
              <Search className="w-4 h-4" />
              <span>Find Room</span>
            </Button>

            <Button
              className="bg-primary hover:bg-blue-700 text-white"
              size="sm"
              onClick={() => setReserveRoomModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              <span>Reserve Room</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Calendar controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="text-lg font-semibold min-w-[200px] text-center">{getDisplayTitle()}</h3>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Tabs value={view} onValueChange={(value) => setView(value as typeof view)}>
              <TabsList>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar content */}
          <div className="border rounded-lg p-4 bg-white overflow-hidden">
            {view === "today" && <TodayView />}
            {view === "week" && <WeekView />}
            {view === "month" && <MonthView />}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
              <span>Scheduled Class</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <FindRoomModal open={findRoomModalOpen} onOpenChange={setFindRoomModalOpen} userRole={userRole} />

      <ReserveRoomModal
        open={reserveRoomModalOpen}
        onOpenChange={setReserveRoomModalOpen}
        userRole={userRole}
        onReservationComplete={handleReservationComplete}
      />
    </Card>
  )
}
