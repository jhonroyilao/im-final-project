"use client"

import { useState, useEffect } from "react"
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
import { supabase } from "@/lib/supabase"

interface RoomCalendarProps {
  
}

interface ScheduledClass {
  scheduled_class_id: number;
  room_id: number;
  section: string;
  instructor_name: number;
  day_of_week: number;
  time_start: string;
  time_end: string;
  semester: string;
  academic_year: string;
  course_code: string;
  max_student: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  Room?: {
    room_number: string;
    room_capacity: number;
  };
  Faculty?: {
    faculty_number: string;
    Users?: {
      first_name: string;
      last_name: string;
    };
  };
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

export default function RoomCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"today" | "week" | "month">("today")
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([])

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
    // Generate a consistent color based on the section
    const colors: Record<string, string> = {
      'BSCS 1-1': '#FFB6C1', // Light Pink
      'BSCS 1-2': '#98FB98', // Pale Green
      'BSCS 1-3': '#87CEEB', // Sky Blue
      'BSCS 1-4': '#DDA0DD', // Plum
      'BSCS 1-5': '#F0E68C', // Khaki
      'BSCS 2-1': '#E6E6FA', // Lavender
      'BSCS 2-2': '#FFA07A', // Light Salmon
      'BSCS 2-3': '#98FB98', // Pale Green
      'BSCS 2-4': '#87CEEB', // Sky Blue
      'BSCS 2-5': '#DDA0DD', // Plum
      'BSCS 3-1': '#F0E68C', // Khaki
      'BSCS 3-2': '#E6E6FA', // Lavender
      'BSCS 3-3': '#FFA07A', // Light Salmon
      'BSCS 3-4': '#98FB98', // Pale Green
      'BSCS 3-5': '#87CEEB', // Sky Blue
      'BSIT 1-1': '#DDA0DD', // Plum
      'BSIT 1-2': '#F0E68C', // Khaki
      'BSIT 1-3': '#E6E6FA', // Lavender
      'BSIT 1-4': '#FFA07A', // Light Salmon
      'BSIT 1-5': '#98FB98', // Pale Green
      'BSIT 2-1': '#87CEEB', // Sky Blue
      'BSIT 2-2': '#DDA0DD', // Plum
      'BSIT 2-3': '#F0E68C', // Khaki
      'BSIT 2-4': '#E6E6FA', // Lavender
      'BSIT 2-5': '#FFA07A', // Light Salmon
    };
    return colors[section] || '#E6E6FA'; // Default to Lavender if section not found
  };

  useEffect(() => {
    const fetchScheduledClasses = async () => {
      try {
        console.log('Attempting to fetch scheduled classes...');
        
        // Now try the full query with filters
        const { data, error } = await supabase
          .from('scheduledclass')
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
            is_active,
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
          .eq('semester', 'Second Semester')
          .eq('academic_year', '2024-2025')
          .eq('is_active', true);

        console.log('Filtered query result:', { 
          data, 
          error,
          filters: {
            semester: 'Second Semester',
            academic_year: '2024-2025',
            is_active: true
          }
        });

        if (error) {
          console.error('Error fetching scheduled classes:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          return;
        }

        if (!data || data.length === 0) {
          console.log('No scheduled classes found for the current semester');
          setScheduledClasses([]);
          return;
        }

        const transformedData: ScheduledClass[] = data.map(item => ({
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
          is_active: item.is_active,
          created_at: item.created_at,
          updated_at: item.updated_at,
          Room: item.Room?.[0],
          Faculty: item.Faculty?.[0] ? {
            ...item.Faculty[0],
            Users: item.Faculty[0].Users?.[0]
          } : undefined
        }));

        console.log('Transformed data:', transformedData);
        
        setScheduledClasses(transformedData);
      } catch (error) {
        console.error('Unexpected error in fetchScheduledClasses:', error);
      }
    };

    fetchScheduledClasses();
  }, []);

  const getScheduledClass = (roomId: string, date: Date, time: string) => {
    // Convert room name (e.g., 'S509') to room ID (e.g., 9)
    const room = rooms.find(r => r.name === roomId);
    if (!room) {
      console.log('Room not found:', roomId);
      return undefined;
    }

    // Convert JavaScript day (0-6) to database day (1-7)
    const jsDayOfWeek = date.getDay();
    const dbDayOfWeek = jsDayOfWeek === 0 ? 7 : jsDayOfWeek; // Convert Sunday (0) to 7

    console.log('Checking for scheduled class:', {
      roomId,
      roomNumber: room.id,
      jsDayOfWeek,
      dbDayOfWeek,
      time,
      availableClasses: scheduledClasses,
      date: date.toISOString()
    });
    
    // Log each class we're checking
    scheduledClasses.forEach(cls => {
      console.log('Checking class:', {
        classRoomId: cls.room_id,
        classDayOfWeek: cls.day_of_week,
        classTimeStart: cls.time_start,
        classTimeEnd: cls.time_end,
        classIsActive: cls.is_active,
        matches: {
          roomMatch: cls.room_id === room.id,
          dayMatch: cls.day_of_week === dbDayOfWeek,
          timeMatch: cls.time_start <= time && cls.time_end > time,
          activeMatch: cls.is_active
        }
      });
    });
    
    const foundClass = scheduledClasses.find(
      (cls) => {
        const matches = cls.room_id === room.id &&
          cls.day_of_week === dbDayOfWeek &&
          cls.time_start <= time &&
          cls.time_end > time &&
          cls.is_active;
        
        if (matches) {
          console.log('Found matching class:', cls);
        }
        
        return matches;
      }
    );

    console.log('Found class:', foundClass);
    return foundClass;
  };

  const renderCell = (roomId: string, date: Date, time: string) => {
    const scheduledClass = getScheduledClass(roomId, date, time);
    console.log('Rendering cell:', {
      roomId,
      date: date.toISOString(),
      time,
      scheduledClass,
    });

    if (scheduledClass) {
      return (
        <div 
          className="p-2 rounded bg-red-200 border border-red-400 h-full"
        >
          <div className="font-semibold text-sm">{scheduledClass.section}</div>
          <div className="text-xs">{scheduledClass.course_code}</div>
        </div>
      );
    }

    return null;
  };

  const TodayView = () => (
    <div className="grid grid-cols-10 gap-1 text-sm">
      {/* Header */}
      <div className="p-2 font-medium text-gray-600 border-b">Time</div>
      {rooms.map((room) => (
        <div key={room.id} className="p-2 font-medium text-center border-b bg-gray-50">
          <div className="font-semibold">{room.name}</div>
        </div>
      ))}

      {/* Time slots */}
      {timeSlots.map((time) => (
        <div key={time} className="contents">
          <div className="p-2 text-gray-600 border-r border-b font-medium">{time}</div>
          {rooms.map((room) => {
            return (
              <div
                key={`${time}-${room.id}`}
                className={`p-1 border-r border-b min-h-[60px] ${
                  renderCell(room.name, currentDate, time)
                    ? 'bg-red-100 border-red-300'
                    : 'hover:bg-blue-50'
                } cursor-pointer transition-colors`}
              >
                {renderCell(room.name, currentDate, time)}
              </div>
            );
          })}
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
            {dateRange.slice(0, 7).map((date) => {
              return (
                <div
                  key={`${room.id}-${date.toISOString()}`}
                  className={`p-1 border rounded min-h-[80px] ${
                    renderCell(room.name, date, timeSlots[0])
                      ? 'bg-red-100 border-red-300'
                      : 'hover:bg-blue-50'
                  } cursor-pointer transition-colors`}
                >
                  {renderCell(room.name, date, timeSlots[0])}
                </div>
              );
            })}
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
