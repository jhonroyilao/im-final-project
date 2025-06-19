"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Clock, Search, Loader2, Users } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import ReserveRoomModal from "./reserve-room-modal"

interface FindRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: "student" | "faculty" | "admin"
}

interface Equipment {
  item_id: number
  item_name: string
  category_id: number
  inventorycategory?: {
    category_name: string
  }
}

interface Room {
  room_id: number
  room_number: string
  room_capacity: number
  room_status: number
  is_available: boolean
  description?: string
  equipment?: string[]
}

export default function FindRoomModal({ open, onOpenChange, userRole }: FindRoomModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [formData, setFormData] = useState({
    timeStart: "08:00",
    timeEnd: "10:00",
    capacity: "",
  })
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([])
  const [searchResults, setSearchResults] = useState<Room[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>([])

  // State for the reserve modal
  const [reserveModalOpen, setReserveModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  // Fetch equipment from database
  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true)
      try {
        // First, get all inventory items
        const { data: items, error: itemsError } = await supabase
          .from("inventoryitem")
          .select("item_id, item_name, category_id")
          .gt("quantity", 0) // Only show items with quantity > 0
          .order("item_name")

        if (itemsError) throw itemsError

        // Then get all categories to map them to items
        const { data: categories, error: categoriesError } = await supabase
          .from("inventorycategory")
          .select("category_id, category_name")

        if (categoriesError) throw categoriesError

        // Map categories to items
        const equipmentWithCategories =
          items?.map((item) => {
            const category = categories?.find((cat) => cat.category_id === item.category_id)
            return {
              ...item,
              inventorycategory: category || { category_name: "Unknown" },
            }
          }) || []

        setEquipment(equipmentWithCategories)
      } catch (error) {
        console.error("Error fetching equipment:", error)
        toast.error("Failed to load equipment data")
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchEquipment()
    }
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEquipmentChange = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedEquipment((prev) => [...prev, itemId])
    } else {
      setSelectedEquipment((prev) => prev.filter((id) => id !== itemId))
    }
  }

  const handleSearch = async () => {
    if (!date) {
      toast.error("Please select a date")
      return
    }

    setSearching(true)
    setSearchResults(null)

    try {
      // Format date for database query
      const formattedDate = format(date, "yyyy-MM-dd")

      // First, get all available rooms
      const { data: rooms, error: roomsError } = await supabase
        .from("room")
        .select("*")
        .eq("room_status", 1)
        .order("room_number")

      if (roomsError) throw roomsError

      if (!rooms || rooms.length === 0) {
        setSearchResults([])
        toast.info("No rooms are currently available")
        return
      }

      // Get all reservations for the selected date
      const { data: reservations, error: reservationsError } = await supabase
        .from("reservation")
        .select("*")
        .eq("reservation_date", formattedDate)
        .in("room_status", [3, 1]) // Pending (3) or approved (1) reservations

      if (reservationsError) throw reservationsError

      // Get all scheduled classes for the day of week
      const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convert Sunday from 0 to 7 for DB

      const { data: scheduledClasses, error: classesError } = await supabase
        .from("scheduledclass")
        .select("*")
        .eq("day_of_week", dayOfWeek)

      if (classesError) throw classesError

      // Filter rooms based on time conflicts
      const startTime = formData.timeStart
      const endTime = formData.timeEnd
      const capacity = formData.capacity ? Number.parseInt(formData.capacity) : 0

      const availableRooms = rooms.filter((room) => {
        // Check reservation conflicts
        const hasReservationConflict = reservations?.some(
          (reservation) =>
            reservation.room_id === room.room_id &&
            ((startTime >= reservation.start_time && startTime < reservation.end_time) ||
              (endTime > reservation.start_time && endTime <= reservation.end_time) ||
              (startTime <= reservation.start_time && endTime >= reservation.end_time)),
        )

        // Check scheduled class conflicts
        const hasClassConflict = scheduledClasses?.some(
          (cls) =>
            cls.room_id === room.room_id &&
            ((startTime >= cls.time_start && startTime < cls.time_end) ||
              (endTime > cls.time_start && endTime <= cls.time_end) ||
              (startTime <= cls.time_start && endTime >= cls.time_end)),
        )

        // Check capacity requirement
        const hasEnoughCapacity = capacity === 0 || room.room_capacity >= capacity

        return !hasReservationConflict && !hasClassConflict && hasEnoughCapacity
      })

      // If equipment is selected, filter rooms that have the equipment
      let finalRooms = availableRooms

      if (selectedEquipment.length > 0) {
        // Get room equipment mappings
        const { data: roomEquipment, error: equipmentError } = await supabase
          .from("roomequipment")
          .select("*")
          .in(
            "room_id",
            availableRooms.map((room) => room.room_id),
          )

        if (equipmentError) throw equipmentError

        // Filter rooms that have all selected equipment
        finalRooms = availableRooms.filter((room) => {
          const roomEquipmentIds = roomEquipment?.filter((re) => re.room_id === room.room_id).map((re) => re.item_id)

          return selectedEquipment.every((equipId) => roomEquipmentIds?.includes(equipId))
        })

        // Enhance rooms with their equipment details
        for (const room of finalRooms) {
          const roomEquipmentIds =
            roomEquipment?.filter((re) => re.room_id === room.room_id).map((re) => re.item_id) || []

          const equipmentNames = equipment.filter((e) => roomEquipmentIds.includes(e.item_id)).map((e) => e.item_name)

          room.equipment = equipmentNames
        }
      }

      setSearchResults(finalRooms)

      if (finalRooms.length === 0) {
        toast.info("No rooms available matching your criteria")
      }
    } catch (error) {
      let errorMsg = "";
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMsg = JSON.stringify(error);
      } else {
        errorMsg = String(error);
      }
      console.error("Error searching for rooms:", errorMsg);
      toast.error(`Failed to search for available rooms: ${errorMsg}`);
    } finally {
      setSearching(false)
    }
  }

  const handleReserve = (room: Room) => {
    setSelectedRoom(room)
    setReserveModalOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">Find Available Room</DialogTitle>
            <DialogDescription>Search for available rooms based on your requirements.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeStart" className="text-right">
                Time Start
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="timeStart"
                    name="timeStart"
                    type="time"
                    value={formData.timeStart}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeEnd" className="text-right">
                Time End
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="timeEnd"
                    name="timeEnd"
                    type="time"
                    value={formData.timeEnd}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Capacity Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacity
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4 text-gray-500" />
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    placeholder="Minimum number of students"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Required Equipment */}
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right">
                <Label>Required Equipment</Label>
              </div>
              <div className="col-span-3">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {equipment.map((item) => (
                      <div key={item.item_id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`equipment-${item.item_id}`}
                          checked={selectedEquipment.includes(item.item_id)}
                          onCheckedChange={(checked) => handleEquipmentChange(item.item_id, checked as boolean)}
                        />
                        <Label htmlFor={`equipment-${item.item_id}`} className="font-normal text-sm">
                          {item.item_name}
                          <span className="text-xs text-gray-500 ml-1">({item.inventorycategory?.category_name})</span>
                        </Label>
                      </div>
                    ))}
                    {equipment.length === 0 && (
                      <div className="col-span-2 text-sm text-gray-500">No equipment available</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSearch} className="bg-primary hover:bg-blue-700" disabled={searching || !date}>
              {searching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Find Rooms
                </>
              )}
            </Button>
          </DialogFooter>

          {/* Search Results */}
          {searchResults && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Available Rooms</h3>
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((room) => (
                    <Card key={room.room_id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">Room {room.room_number}</h3>
                            <p className="text-sm text-gray-500">{room.description || `Room ${room.room_number}`}</p>
                            <p className="text-sm text-gray-500 mt-1">Capacity: {room.room_capacity} students</p>
                            {room.equipment && room.equipment.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-gray-700">Available Equipment:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {room.equipment.map((eq) => (
                                    <span
                                      key={eq}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {eq}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-primary hover:bg-blue-700"
                            onClick={() => handleReserve(room)}
                          >
                            Reserve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No rooms available matching your criteria</p>
                  <p className="text-sm text-gray-400 mt-1">Try adjusting your search parameters</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reserve Room Modal */}
      {selectedRoom && (
        <ReserveRoomModal
          open={reserveModalOpen}
          onOpenChange={setReserveModalOpen}
          userRole={userRole}
          preselectedRoom={selectedRoom}
          preselectedDate={date}
          preselectedTimeStart={formData.timeStart}
          preselectedTimeEnd={formData.timeEnd}
          onReservationComplete={() => {
            onOpenChange(false)
            setReserveModalOpen(false)
          }}
        />
      )}
    </>
  )
}
