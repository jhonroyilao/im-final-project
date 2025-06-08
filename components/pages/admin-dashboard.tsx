"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Package, BarChart3, Search } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RoomCalendar from "@/components/calendar/room-calendar"
import ReservationSidebar from "@/components/reservation/reservation-sidebar"

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showFindModal, setShowFindModal] = useState(false)
  const [showReserveModal, setShowReserveModal] = useState(false)
  // const roleColor = "purple-600"

  // Dashboard overview with stats
  const DashboardOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-blue-50 border-blue-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-700 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Reservations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-700">0</div>
          <p className="text-blue-600 text-sm">Active reservations this week</p>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-yellow-700 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-700">0</div>
          <p className="text-yellow-600 text-sm">Pending approval requests</p>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-700 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-700">0</div>
          <p className="text-green-600 text-sm">Items with low stock</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Reservation requests awaiting approval</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No pending requests</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Overall system health</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Database</span>
              <span className="text-green-600 text-sm font-medium">Online</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Reservations</span>
              <span className="text-green-600 text-sm font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Notifications</span>
              <span className="text-green-600 text-sm font-medium">Working</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Reservation requests list
  const ReservationRequests = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Reservation Requests</CardTitle>
          <CardDescription>Manage pending reservation requests</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button variant="outline" size="sm">
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
          <p className="text-gray-500">All reservation requests have been processed.</p>
        </div>
      </CardContent>
    </Card>
  )

  // Inventory management
  const InventoryManagement = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Manage equipment and supplies</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Filter
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items</h3>
          <p className="text-gray-500 mb-4">Start by adding equipment and supplies to the inventory.</p>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Package className="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout userRole="admin">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage reservations, requests, and inventory</p>
          </div>

          <Tabs value={activeTab} className="space-y-6" onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white" onClick={() => setShowFindModal(true)}>
                  <Search className="w-4 h-4 mr-2" />
                  Find Room
                </Button>
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={() => setShowReserveModal(true)}>
                  <Clock className="w-4 h-4 mr-2" />
                  Reserve Room
                </Button>
              </div>
            </div>

            <TabsContent value="dashboard" className="mt-6">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <RoomCalendar />
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <ReservationRequests />
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <InventoryManagement />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block border-l bg-gray-50 p-4">
          <ReservationSidebar userRole="admin" />
        </div>
      </div>
    </DashboardLayout>
  )
}
