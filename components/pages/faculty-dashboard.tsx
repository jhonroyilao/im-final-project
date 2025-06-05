"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Search } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RoomCalendar from "@/components/calendar/room-calendar"
import ReservationSidebar from "@/components/reservation/reservation-sidebar"
import ReserveRoomModal from "@/components/reservation/reserve-room-modal"
import FindRoomModal from "@/components/reservation/find-room-modal"

export default function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("calendar")
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [showFindModal, setShowFindModal] = useState(false)

  return (
    <DashboardLayout userRole="faculty">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
            <p className="text-gray-600">Manage your lab reservations and class schedules</p>
          </div>

          <Tabs defaultValue="calendar" className="space-y-6" onValueChange={setActiveTab} value={activeTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
                <TabsTrigger value="reservations" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">My Reservations</span>
                </TabsTrigger>
                <TabsTrigger value="find" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Find Room</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden md:flex border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                  onClick={() => setShowFindModal(true)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Find Room
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowReserveModal(true)}>
                  <Clock className="w-4 h-4 mr-2" />
                  Reserve Room
                </Button>
              </div>
            </div>

            <TabsContent value="calendar" className="mt-6">
              <RoomCalendar onReserveRoom={() => setShowReserveModal(true)} onFindRoom={() => setShowFindModal(true)} />
            </TabsContent>

            <TabsContent value="reservations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>My Reservations</CardTitle>
                  <CardDescription>View and manage your lab reservations and class schedules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reservations yet</h3>
                    <p className="text-gray-500 mb-4">
                      Start by reserving a room for your classes or research activities.
                    </p>
                    <Button onClick={() => setShowReserveModal(true)} className="bg-green-600 hover:bg-green-700">
                      Reserve a Room
                    </Button>
                  </div>
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
                    <p className="text-gray-500 mb-4">
                      Search for rooms based on date, time, capacity, and equipment needs.
                    </p>
                    <Button onClick={() => setShowFindModal(true)} className="bg-green-600 hover:bg-green-700">
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
          <ReservationSidebar userRole="faculty" />
        </div>
      </div>

      {/* Modals */}
      <ReserveRoomModal open={showReserveModal} onOpenChange={setShowReserveModal} userRole="faculty" />

      <FindRoomModal open={showFindModal} onOpenChange={setShowFindModal} />
    </DashboardLayout>
  )
}
