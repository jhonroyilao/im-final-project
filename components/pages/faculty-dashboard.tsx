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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hello, CCIS Professor!</h1>
            <p className="text-gray-600">Manage your lab reservations and class schedules here.</p>
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
                
                
              </div>
            </div>

            <TabsContent value="calendar" className="mt-6">
              <RoomCalendar />
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
                    <Button onClick={() => setShowReserveModal(true)} className="bg-primary hover:bg-primary/90 text-white">
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
                    <Button onClick={() => setShowFindModal(true)} className="bg-primary hover:bg-primary/90 text-white">
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

      <FindRoomModal open={showFindModal} onOpenChange={setShowFindModal} userRole="faculty" />
    </DashboardLayout>
  )
}
