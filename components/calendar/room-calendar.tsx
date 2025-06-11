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

  useEffect(() => {
    const fetchScheduledClasses = async () => {
      try {
        console.log('Attempting to fetch scheduled classes...');
        
        // First, let's try to get all tables
        const { data: tables, error: tablesError } = await supabase
          .from('scheduledclass')
          .select('*')
          .limit(1);

        if (tablesError) {
          console.error('Error accessing scheduledclass table:', {
            message: tablesError.message,
            details: tablesError.details,
            hint: tablesError.hint,
            code: tablesError.code
          });

          // Try alternative table names
          const alternativeNames = ['ScheduledClass', 'scheduled_class', 'scheduledclasses'];
          
          for (const tableName of alternativeNames) {
            console.log(`Trying alternative table name: ${tableName}`);
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error) {
              console.log(`Found working table name: ${tableName}`);
              // Use this table name for the full query
              const { data: fullData, error: fullError } = await supabase
                .from(tableName)
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

              if (fullError) {
                console.error('Error with full query:', {
                  message: fullError.message,
                  details: fullError.details,
                  hint: fullError.hint,
                  code: fullError.code
                });
                return;
              }

              if (!fullData || fullData.length === 0) {
                console.log('No scheduled classes found for the current semester');
                setScheduledClasses([]);
                return;
              }

              const transformedData: ScheduledClass[] = fullData.map(item => ({
                ...item,
                Room: item.Room?.[0],
                Faculty: item.Faculty?.[0] ? {
                  ...item.Faculty[0],
                  Users: item.Faculty[0].Users?.[0]
                } : undefined
              }));

              console.log('Successfully fetched scheduled classes:', {
                count: transformedData.length,
                firstClass: transformedData[0]
              });
              
              setScheduledClasses(transformedData);
              return;
            }
          }
          
          console.error('Could not find the scheduled classes table with any of the attempted names');
          return;
        }

        // If we get here, the original table name worked
        console.log('Found working table name: scheduledclass');
        
        // Now try the full query with joins
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

        if (error) {
          console.error('Error with full query:', {
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
          ...item,
          Room: item.Room?.[0],
          Faculty: item.Faculty?.[0] ? {
            ...item.Faculty[0],
            Users: item.Faculty[0].Users?.[0]
          } : undefined
        }));

        console.log('Successfully fetched scheduled classes:', {
          count: transformedData.length,
          firstClass: transformedData[0]
        });
        
        setScheduledClasses(transformedData);
      } catch (error) {
        console.error('Unexpected error in fetchScheduledClasses:', error);
      }
    };

    fetchScheduledClasses();

    // Set up real-time subscription
    const subscription = supabase
      .channel('scheduled_class_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scheduledclass'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setScheduledClasses(prev => [...prev, payload.new as ScheduledClass]);
              break;
            case 'UPDATE':
              setScheduledClasses(prev => 
                prev.map(cls => cls.scheduled_class_id === payload.new.scheduled_class_id ? payload.new as ScheduledClass : cls)
              );
              break;
            case 'DELETE':
              setScheduledClasses(prev => 
                prev.filter(cls => cls.scheduled_class_id !== payload.old.scheduled_class_id)
              );
              break;
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getScheduledClass = (roomId: string, date: Date, time: string) => {
    const dayOfWeek = date.getDay();
    return scheduledClasses.find(
      (cls) =>
        cls.room_id.toString() === roomId &&
        cls.day_of_week === dayOfWeek &&
        cls.time_start <= time &&
        cls.time_end > time &&
        cls.is_active
    );
  };

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
          {rooms.map((room) => {
            const scheduledClass = getScheduledClass(room.id, currentDate, time);
            return (
              <div
                key={`${time}-${room.id}`}
                className={`p-1 border-r border-b min-h-[60px] ${
                  scheduledClass
                    ? 'bg-red-100 border-red-300'
                    : 'hover:bg-blue-50'
                } cursor-pointer transition-colors`}
              >
                {scheduledClass && (
                  <div className="text-xs">
                    <div className="font-medium text-red-700">{scheduledClass.course_code}</div>
                    <div className="text-red-600">Section {scheduledClass.section}</div>
                  </div>
                )}
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
              const scheduledClass = getScheduledClass(room.id, date, timeSlots[0]);
              return (
                <div
                  key={`${room.id}-${date.toISOString()}`}
                  className={`p-1 border rounded min-h-[80px] ${
                    scheduledClass
                      ? 'bg-red-100 border-red-300'
                      : 'hover:bg-blue-50'
                  } cursor-pointer transition-colors`}
                >
                  {scheduledClass && (
                    <div className="text-xs">
                      <div className="font-medium text-red-700">{scheduledClass.course_code}</div>
                      <div className="text-red-600">Section {scheduledClass.section}</div>
                      <div className="text-red-500">
                        {scheduledClass.time_start} - {scheduledClass.time_end}
                      </div>
                    </div>
                  )}
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
