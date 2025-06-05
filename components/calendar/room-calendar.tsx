"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
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

interface RoomCalendarProps {
  onReserveRoom?: () => void
  onFindRoom?: () => void
}

const rooms = [
  { id: "S501", name: "S501", description: "" },
  { id: "S502", name: "S502", description: "" },
  { id: "S503", name: "S503", description: "" },
  { id: "S504", name: "S504", description: "" },
  { id: "S505", name: "S505", description: "" },
  { id: "S506", name: "S506", description: "" },
  { id: "S507", name: "S507", description: "" },
  { id: "S508", name: "S508", description: "" },
  { id: "S509", name: "S509", description: "" },
]

const timeSlots = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
]

export default function RoomCalendar({ onReserveRoom, onFindRoom }: RoomCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"today" | "week" | "month">("week")

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

  const TodayView = () => (
    <div className="grid grid-cols-10 gap-1 text-sm">
      {/* Header */}
      <div className="p-2 font-medium text-gray-600 border-b">Time</div>
      {rooms.map((room) => (
        <div key={room.id} className="p-2 font-medium text-center border-b bg-gray-50">
          <div className="font-semibold">{room.name}</div>
          <div className="text-xs text-gray-500">{room.description}</div>
        </div>
      ))}

      {/* Time slots */}
      {timeSlots.map((time) => (
        <div key={time} className="contents">
          <div className="p-2 text-gray-600 border-r border-b font-medium">{time}</div>
          {rooms.map((room) => (
            <div
              key={`${time}-${room.id}`}
              className="p-1 border-r border-b min-h-[60px] hover:bg-blue-50 cursor-pointer transition-colors"
            >
              {/* Empty slot - can be clicked to reserve */}
            </div>
          ))}
        </div>
      ))}
    </div>
  )

  const WeekView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Days header */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="p-2"></div>
          {dateRange.slice(0, 7).map((date) => (
            <div key={date.toISOString()} className="p-2 text-center">
              <div className="font-semibold">{format(date, "EEE")}</div>
              <div className={`text-sm ${isSameDay(date, new Date()) ? "text-primary font-bold" : "text-gray-600"}`}>
                {format(date, "MMM d")}
              </div>
            </div>
          ))}
        </div>

        {/* Rooms and time grid */}
        {rooms.map((room) => (
          <div key={room.id} className="grid grid-cols-8 gap-1 mb-1">
            <div className="p-2 bg-gray-50 border rounded">
              <div className="font-semibold text-sm">{room.name}</div>
              <div className="text-xs text-gray-500">{room.description}</div>
            </div>
            {dateRange.slice(0, 7).map((date) => (
              <div
                key={`${room.id}-${date.toISOString()}`}
                className="p-1 border rounded min-h-[80px] hover:bg-blue-50 cursor-pointer transition-colors"
              >
                {/* Empty slot - can show reservations here */}
              </div>
            ))}
          </div>
        ))}
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
            <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-50">
              {day}
            </div>
          ))}

          {weeks.map((week) => {
            const days = eachDayOfInterval({
              start: week,
              end: addDays(week, 6),
            })

            return days.map((date) => (
              <div
                key={date.toISOString()}
                className={`p-2 min-h-[100px] border hover:bg-blue-50 cursor-pointer transition-colors ${
                  isSameDay(date, new Date()) ? "bg-blue-100 border-primary" : ""
                } ${date.getMonth() !== currentDate.getMonth() ? "text-gray-400 bg-gray-50" : ""}`}
              >
                <div className="font-medium text-sm">{format(date, "d")}</div>
                {/* Room availability indicators can go here */}
                <div className="mt-1 space-y-1">{/* Small indicators for room availability */}</div>
              </div>
            ))
          })}
        </div>

        {/* Room legend */}
        <div className="grid grid-cols-3 md:grid-cols-9 gap-2 mt-4">
          {rooms.map((room) => (
            <div key={room.id} className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 bg-primary rounded"></div>
              <span>{room.name}</span>
            </div>
          ))}
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

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button
              onClick={onFindRoom}
              variant="outline"
              size="sm"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              Find Room
            </Button>
            <Button onClick={onReserveRoom} size="sm" className="bg-primary hover:bg-primary/90">
              Reserve Room
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
          <div className="border rounded-lg p-4 bg-white">
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
    </Card>
  )
}
