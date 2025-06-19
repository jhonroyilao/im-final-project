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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CalendarIcon, Clock, Users, Upload, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface ReserveRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: "student" | "faculty" | "admin"
  preselectedRoom?: {
    room_id: number
    room_number: string
    room_capacity: number
  }
  preselectedDate?: Date
  preselectedTimeStart?: string
  preselectedTimeEnd?: string
  onReservationComplete?: () => void
}

interface Room {
  room_id: number
  room_number: string
  room_capacity: number
  description?: string
  preIncludedEquipment?: string[]
  room_status: number
}

interface Equipment {
  item_id: number
  item_name: string
  category_id: number
  inventorycategory?: {
    category_name: string
  }
}

// Room status constants - updated to match your database
const ROOM_STATUS = {
  APPROVED: 1, // "Approved"
  REJECTED: 2, // "Rejected"
  PENDING: 3, // "Pending"
  CANCELLED: 4, // "Cancelled"
}

export default function ReserveRoomModal({
  open,
  onOpenChange,
  userRole,
  preselectedRoom,
  preselectedDate,
  preselectedTimeStart,
  preselectedTimeEnd,
  onReservationComplete,
}: ReserveRoomModalProps) {
  const [date, setDate] = useState<Date | undefined>(preselectedDate || undefined)
  const [selectedRoom, setSelectedRoom] = useState<string>(preselectedRoom ? preselectedRoom.room_id.toString() : "")
  const [requestItems, setRequestItems] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [formData, setFormData] = useState({
    timeStart: preselectedTimeStart || "",
    timeEnd: preselectedTimeEnd || "",
    numberOfStudents: "",
    reason: "",
    priorityLevel: "4", // Default to lowest priority
  })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [selectedRoomEquipment, setSelectedRoomEquipment] = useState<string[]>([])
  const [roomStatuses, setRoomStatuses] = useState<{ id: number; name: string }[]>([])
  const [timeErrors, setTimeErrors] = useState({ timeStart: '', timeEnd: '' });

  // Fetch rooms, equipment, and room statuses from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch rooms
        const { data: roomsData, error: roomsError } = await supabase
          .from("room")
          .select("*")
          .order("room_number")

        if (roomsError) throw roomsError
        setRooms(roomsData || [])

        // Fetch equipment - using the two-step approach to avoid join issues
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

        // Fetch room statuses to get valid status IDs
        const { data: statuses, error: statusesError } = await supabase
          .from("reservationstatus")
          .select("*")
          .order("reservation_status_id")

        if (statusesError) {
          console.error("Error fetching room statuses:", statusesError)
        } else {
          setRoomStatuses(
            statuses?.map((status) => ({
              id: status.reservation_status_id,
              name: status.reservation_status,
            })) || [],
          )
          console.log("Available room statuses:", statuses)
        }

        // If a room is preselected, fetch its equipment
        if (preselectedRoom) {
          await fetchRoomEquipment(preselectedRoom.room_id)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load necessary data")
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open, preselectedRoom])

  // Fetch room equipment when a room is selected
  const fetchRoomEquipment = async (roomId: number) => {
    try {
      // Get equipment IDs for the room
      const { data: roomEquipment, error: equipmentError } = await supabase
        .from("roomequipment")
        .select("item_id")
        .eq("room_id", roomId)

      if (equipmentError) throw equipmentError

      if (roomEquipment && roomEquipment.length > 0) {
        // Get equipment details
        const equipmentIds = roomEquipment.map((re) => re.item_id)

        const { data: equipmentDetails, error: detailsError } = await supabase
          .from("inventoryitem")
          .select("item_name")
          .in("item_id", equipmentIds)

        if (detailsError) throw detailsError

        setSelectedRoomEquipment(equipmentDetails?.map((e) => e.item_name) || [])
      } else {
        setSelectedRoomEquipment([])
      }
    } catch (error) {
      console.error("Error fetching room equipment:", error)
      toast.error("Failed to load room equipment")
    }
  }

  // Helper to check if a time is within allowed range
  const isTimeValid = (time: string) => {
    if (!time) return false;
    return time >= '07:00' && time <= '21:00';
  };

  // Enhanced input change handler for time validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Validate time fields
    if (name === 'timeStart' || name === 'timeEnd') {
      setTimeErrors((prev) => ({
        ...prev,
        [name]: isTimeValid(value) ? '' : 'Time must be between 07:00 and 21:00',
      }));
    }
  };

  const handleRoomChange = async (roomId: string) => {
    setSelectedRoom(roomId)
    if (roomId) {
      await fetchRoomEquipment(Number.parseInt(roomId))
    } else {
      setSelectedRoomEquipment([])
    }
  }

  const handleItemChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: 1,
      }))
    } else {
      const newSelected = { ...selectedItems }
      delete newSelected[itemId]
      setSelectedItems(newSelected)
    }
  }

  const handleQuantityChange = (itemId: string, quantity: string) => {
    const numQuantity = Number.parseInt(quantity, 10)
    if (!isNaN(numQuantity) && numQuantity > 0) {
      setSelectedItems((prev) => ({
        ...prev,
        [itemId]: numQuantity,
      }))
    }
  }

  const handleSubmit = async () => {
    if (
      !date ||
      !formData.timeStart ||
      !formData.timeEnd ||
      !selectedRoom ||
      !formData.numberOfStudents ||
      !formData.reason
    ) {
      toast.error("Please fill in all required fields")
      return
    }
    // Check time errors
    if (timeErrors.timeStart || timeErrors.timeEnd) {
      toast.error("Reservation time must be between 07:00 and 21:00")
      return
    }
    if (!isTimeValid(formData.timeStart) || !isTimeValid(formData.timeEnd)) {
      toast.error("Reservation time must be between 07:00 and 21:00")
      return
    }

    // Validate capacity
    const roomCapacity = rooms.find((room) => room.room_id.toString() === selectedRoom)?.room_capacity || 0
    const requestedCapacity = Number.parseInt(formData.numberOfStudents)
    if (requestedCapacity > roomCapacity) {
      toast.error(`This room can only accommodate ${roomCapacity} students`)
      return
    }

    setSubmitting(true)

    try {
      // Get current user ID from localStorage
      const userIdString = (typeof window !== 'undefined') ? localStorage.getItem('userId') : null;
      const userId = userIdString ? Number(userIdString) : null;
      if (!userId) {
        toast.error('User not logged in. Please log in again.');
        setSubmitting(false);
        return;
      }

      // Format date for database
      const formattedDate = format(date, "yyyy-MM-dd")

      // Check for time conflicts
      const { data: conflicts, error: conflictError } = await supabase
        .from("reservation")
        .select("*")
        .eq("reservation_date", formattedDate)
        .eq("room_id", selectedRoom)
        .in("room_status", [ROOM_STATUS.PENDING, ROOM_STATUS.APPROVED]) // Pending (3) or approved (1)
        .or(`start_time.lte.${formData.timeEnd},end_time.gte.${formData.timeStart}`)

      if (conflictError) {
        console.error("Error checking for conflicts:", conflictError)
        throw new Error(`Conflict check failed: ${conflictError.message}`)
      }

      if (conflicts && conflicts.length > 0) {
        toast.error("This room is already reserved for the selected time")
        return
      }

      // Use the correct pending status ID (3)
      const pendingStatusId = ROOM_STATUS.PENDING

      console.log("Submitting reservation with data:", {
        user_id: userId,
        room_id: Number.parseInt(selectedRoom),
        reservation_date: formattedDate,
        start_time: formData.timeStart,
        end_time: formData.timeEnd,
        room_status: pendingStatusId,
        purpose: formData.reason,
        number_of_students: Number.parseInt(formData.numberOfStudents),
        equipment_needed: requestItems && Object.keys(selectedItems).length > 0,
      })

      // Create reservation
      const { data: reservation, error: reservationError } = await supabase
        .from("reservation")
        .insert([
          {
            user_id: userId,
            room_id: Number.parseInt(selectedRoom),
            reservation_date: formattedDate,
            start_time: formData.timeStart,
            end_time: formData.timeEnd,
            room_status: pendingStatusId, // Use the fetched pending status ID
            purpose: formData.reason,
            number_of_students: Number.parseInt(formData.numberOfStudents),
            priority_level: Number.parseInt(formData.priorityLevel),
            equipment_needed: requestItems && Object.keys(selectedItems).length > 0,
          },
        ])
        .select()

      if (reservationError) {
        console.error("Reservation insert error:", reservationError)
        throw new Error(`Reservation failed: ${reservationError.message}`)
      }

      if (!reservation || reservation.length === 0) {
        throw new Error("No reservation data returned after insert")
      }

      // If requesting additional items, create reservation items
      if (requestItems && Object.keys(selectedItems).length > 0) {
        const reservationId = reservation[0].reservation_id

        if (reservationId) {
          const reservationItems = Object.entries(selectedItems).map(([itemId, quantity]) => ({
            reservation_id: reservationId,
            item_id: Number(itemId),
            quantity: quantity,
            // status: 'pending' // optional, if you want to set a status
          }))

          console.log("Adding reservation items:", reservationItems)

          const { error: itemsError } = await supabase.from("requestedequipment").insert(reservationItems)

          if (itemsError) {
            console.error("Reservation items insert error:", itemsError)
            // Don't throw here, as the main reservation was successful
            toast.warning("Reservation created, but there was an issue with the requested items")
          }
        }
      }

      toast.success("Reservation request submitted successfully")

      // Reset form
      setDate(undefined)
      setSelectedRoom("")
      setRequestItems(false)
      setSelectedItems({})
      setFormData({
        timeStart: "",
        timeEnd: "",
        numberOfStudents: "",
        reason: "",
        priorityLevel: "4",
      })

      onOpenChange(false)
      if (onReservationComplete) {
        onReservationComplete()
      }
    } catch (error) {
      console.error("Error submitting reservation:", error)
      let errorMessage = "Failed to submit reservation"

      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      } else if (typeof error === "object" && error !== null) {
        errorMessage += `: ${JSON.stringify(error)}`
      }

      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const selectedRoomData = rooms.find((room) => room.room_id.toString() === selectedRoom)

  useEffect(() => {
    setTimeErrors({
      timeStart: isTimeValid(formData.timeStart) ? '' : (formData.timeStart ? 'Time must be between 07:00 and 21:00' : ''),
      timeEnd: isTimeValid(formData.timeEnd) ? '' : (formData.timeEnd ? 'Time must be between 07:00 and 21:00' : ''),
    });
  }, [open, formData.timeStart, formData.timeEnd]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Reserve a Room</DialogTitle>
          <DialogDescription>
            Fill in the details to request a room reservation.
            {userRole === "faculty" ? " Faculty reservations have priority." : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {/* Date Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date *
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

              {/* Time Start */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="timeStart" className="text-right">
                  Time Start *
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center">
                    <Input
                      id="timeStart"
                      name="timeStart"
                      type="time"
                      value={formData.timeStart}
                      onChange={handleInputChange}
                      className={cn("w-full", timeErrors.timeStart && "border-red-500 focus-visible:ring-red-500")}
                      required
                    />
                  </div>
                  {timeErrors.timeStart && (
                    <p className="text-xs text-red-600 mt-1">{timeErrors.timeStart}</p>
                  )}
                </div>
              </div>

              {/* Time End */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="timeEnd" className="text-right">
                  Time End *
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center">
                    <Input
                      id="timeEnd"
                      name="timeEnd"
                      type="time"
                      value={formData.timeEnd}
                      onChange={handleInputChange}
                      className={cn("w-full", timeErrors.timeEnd && "border-red-500 focus-visible:ring-red-500")}
                      required
                    />
                  </div>
                  {timeErrors.timeEnd && (
                    <p className="text-xs text-red-600 mt-1">{timeErrors.timeEnd}</p>
                  )}
                </div>
              </div>

             

              {/* Room Selection */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="room" className="text-right">
                  Room Number *
                </Label>
                <div className="col-span-3">
                  <Select value={selectedRoom} onValueChange={handleRoomChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map((room) => {
                        const isUnavailable = room.room_status === 2 || room.room_status === 3;
                        return (
                          <SelectItem
                            key={room.room_id}
                            value={room.room_id.toString()}
                            disabled={isUnavailable}
                            className={isUnavailable ? 'opacity-50 pointer-events-none' : ''}
                          >
                            {room.room_number} - {room.description || `Room ${room.room_number}`} (Capacity: {room.room_capacity})
                            {isUnavailable && ' (Unavailable)'}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Number of Students */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="numberOfStudents" className="text-right">
                  No. of Students *
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center">
                    <Input
                      id="numberOfStudents"
                      name="numberOfStudents"
                      type="number"
                      min="1"
                      max={selectedRoomData?.room_capacity || 50}
                      value={formData.numberOfStudents}
                      onChange={handleInputChange}
                      className="w-full"
                      required
                    />
                  </div>
                  {selectedRoomData && (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum capacity: {selectedRoomData.room_capacity} students
                    </p>
                  )}
                  
                  {selectedRoomData &&
                      formData.numberOfStudents &&
                      Number(formData.numberOfStudents) > selectedRoomData.room_capacity && (
                      <p className="text-xs text-red-600 mt-1">
                          Number of students exceeds the room's maximum capacity!
                      </p>
                    )}
                </div>
              </div>

               {/* Main Purpose (Priority Level) */}
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="priorityLevel" className="text-right">
                  Purpose *
                </Label>
                <div className="col-span-3">
                  <Select value={formData.priorityLevel} onValueChange={(value) => setFormData({...formData, priorityLevel: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select main purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">University and/or College Functions</SelectItem>
                      <SelectItem value="3">Make-up and Tutorial Classes</SelectItem>
                      <SelectItem value="4">Co-curricular Activities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reason */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">
                  Reason *
                </Label>
                <Textarea
                  id="reason"
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  placeholder="Describe the purpose of your reservation"
                  className="col-span-3"
                  required
                />
              </div>

              {/* Pre-included Equipment */}
              {selectedRoomData && selectedRoomEquipment.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="text-right">
                    <Label>Included Equipment</Label>
                  </div>
                  <div className="col-span-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Pre-included in {selectedRoomData.room_number}:
                      </p>
                      <ul className="space-y-1">
                        {selectedRoomEquipment.map((equipment, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {equipment}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Additional Items */}
              <div className="grid grid-cols-4 items-start gap-4">
                <div className="text-right">
                  <Label htmlFor="requestItems">Request Items</Label>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="requestItems"
                      checked={requestItems}
                      onCheckedChange={(checked) => setRequestItems(checked as boolean)}
                    />
                    <Label htmlFor="requestItems" className="font-normal">
                      Request additional items (Y/N)
                    </Label>
                  </div>
                </div>
              </div>

              {/* Additional Items Selection */}
              {requestItems && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <div className="text-right">
                    <Label>Items</Label>
                  </div>
                  <div className="col-span-3 space-y-3 max-h-64 overflow-y-auto">
                    {equipment.map((item) => (
                      <div key={item.item_id} className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`item-${item.item_id}`}
                            checked={!!selectedItems[item.item_id]}
                            onCheckedChange={(checked) => handleItemChange(item.item_id.toString(), checked as boolean)}
                          />
                          <Label htmlFor={`item-${item.item_id}`} className="font-normal">
                            {item.item_name}
                            <span className="text-gray-500 text-xs ml-1">
                              ({item.inventorycategory?.category_name})
                            </span>
                          </Label>
                        </div>

                        {selectedItems[item.item_id] && (
                          <div className="ml-6">
                            <Label htmlFor={`quantity-${item.item_id}`} className="text-xs text-gray-500 mb-1 block">
                              Quantity *
                            </Label>
                            <Input
                              id={`quantity-${item.item_id}`}
                              type="number"
                              min="1"
                              className="w-20 h-8"
                              value={selectedItems[item.item_id]}
                              onChange={(e) => handleQuantityChange(item.item_id.toString(), e.target.value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {equipment.length === 0 && (
                      <div className="text-sm text-gray-500">No additional equipment available</div>
                    )}
                  </div>
                </div>
              )}

              {/* File Upload */}
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="file" className="text-right">
                  File Upload
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PDF, DOC, DOCX (MAX. 10MB)</p>
                      </div>
                      <input id="file-upload" type="file" className="hidden" accept=".pdf,.doc,.docx" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={
                  submitting ||
                  !date ||
                  !formData.timeStart ||
                  !formData.timeEnd ||
                  !selectedRoom ||
                  !formData.numberOfStudents ||
                  !formData.priorityLevel ||
                  !formData.reason
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
