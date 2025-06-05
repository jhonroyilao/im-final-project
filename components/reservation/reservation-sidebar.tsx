"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface ReservationSidebarProps {
  userRole: "student" | "faculty" | "admin"
}

interface Reservation {
  id: string
  room: string
  date: string
  timeStart: string
  timeEnd: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  reason: string
  requester?: string
  requesterType?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: "approval" | "rejection" | "info" | "reminder"
  isRead: boolean
  timestamp: string
}

export default function ReservationSidebar({ userRole }: ReservationSidebarProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-600" />
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === notificationId ? { ...notif, isRead: true } : notif)))
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="w-80 space-y-4">
      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Notifications</span>
            </CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="bg-primary">
                {unreadCount}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      notification.isRead ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                    }`}
                    onClick={() => markNotificationAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{notification.timestamp}</p>
                      </div>
                      {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full mt-1"></div>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Current Reservations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>{userRole === "admin" ? "Recent Requests" : "My Reservations"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{userRole === "admin" ? "No recent requests" : "No reservations yet"}</p>
            </div>
          ) : (
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="p-3 border rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm">Room {reservation.room}</h4>
                        <p className="text-xs text-gray-600">
                          {reservation.date} • {reservation.timeStart} - {reservation.timeEnd}
                        </p>
                        {userRole === "admin" && reservation.requester && (
                          <p className="text-xs text-gray-500 mt-1">
                            {reservation.requester} ({reservation.requesterType})
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">{getStatusIcon(reservation.status)}</div>
                    </div>
                    <p className="text-xs text-gray-700 mb-2">{reservation.reason}</p>
                    <Badge variant="outline" className={`text-xs ${getStatusColor(reservation.status)}`}>
                      {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button className="w-full bg-primary hover:bg-primary/90" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            New Reservation
          </Button>
          <Button variant="outline" className="w-full" size="sm">
            View All Reservations
          </Button>
          {userRole === "admin" && (
            <>
              <Button variant="outline" className="w-full" size="sm">
                Manage Requests
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Room Reports
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
