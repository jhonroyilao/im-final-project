"use client"

import type React from "react"

import { useState } from "react"
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
import { CalendarIcon, Clock, Users, Upload } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ReserveRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole: "student" | "faculty" | "admin"
}

// Room data with pre-included equipment
const rooms = [
  {
    id: "S501",
    number: "S501",
    capacity: 30,
    description: "Computer Laboratory 1 - Programming Lab",
    preIncludedEquipment: ["Desktop Computer (30 units)", "Projector (1 unit)", "Whiteboard (1 unit)"],
  },
  {
    id: "S502",
    number: "S502",
    capacity: 25,
    description: "Computer Laboratory 2 - Network Lab",
    preIncludedEquipment: ["Desktop Computer (25 units)", "Network Router (2 units)", "Network Switch (3 units)"],
  },
  {
    id: "S503",
    number: "S503",
    capacity: 35,
    description: "Computer Laboratory 3 - Database Lab",
    preIncludedEquipment: ["Desktop Computer (35 units)", "Projector (1 unit)", "Server (1 unit)"],
  },
  {
    id: "S504",
    number: "S504",
    capacity: 30,
    description: "Computer Laboratory 4 - Web Development Lab",
    preIncludedEquipment: ["Desktop Computer (30 units)", "Projector (1 unit)", "Graphics Tablet (5 units)"],
  },
  {
    id: "S505",
    number: "S505",
    capacity: 28,
    description: "Computer Laboratory 5 - Mobile Development Lab",
    preIncludedEquipment: ["Desktop Computer (28 units)", "Android Devices (10 units)", "iOS Devices (5 units)"],
  },
  {
    id: "S506",
    number: "S506",
    capacity: 32,
    description: "Computer Laboratory 6 - AI/ML Lab",
    preIncludedEquipment: ["High-Performance Computer (32 units)", "GPU Workstation (4 units)", "Projector (1 unit)"],
  },
  {
    id: "S507",
    number: "S507",
    capacity: 30,
    description: "Computer Laboratory 7 - Cybersecurity Lab",
    preIncludedEquipment: ["Desktop Computer (30 units)", "Network Security Appliance (2 units)", "Projector (1 unit)"],
  },
  {
    id: "S508",
    number: "S508",
    capacity: 25,
    description: "Computer Laboratory 8 - Software Engineering Lab",
    preIncludedEquipment: ["Desktop Computer (25 units)", "Projector (1 unit)", "Development Server (1 unit)"],
  },
  {
    id: "S509",
    number: "S509",
    capacity: 40,
    description: "Computer Laboratory 9 - Multimedia Lab",
    preIncludedEquipment: [
      "Desktop Computer (40 units)",
      "Projector (2 units)",
      "Audio System (1 unit)",
      "Video Camera (5 units)",
    ],
  },
]

// Additional equipment that can be requested
const additionalEquipment = [
  { id: "laptop", name: "Laptop", category: "Hardware" },
  { id: "webcam", name: "Webcam", category: "Audio/Visual" },
  { id: "microphone", name: "Microphone", category: "Audio/Visual" },
  { id: "hdmi_cable", name: "HDMI Cable", category: "Cables" },
  { id: "extension_cord", name: "Extension Cord", category: "Electrical" },
  { id: "wireless_mouse", name: "Wireless Mouse", category: "Peripherals" },
  { id: "keyboard", name: "Keyboard", category: "Peripherals" },
  { id: "arduino_kit", name: "Arduino Kit", category: "Development" },
  { id: "raspberry_pi", name: "Raspberry Pi", category: "Development" },
  { id: "vr_headset", name: "VR Headset", category: "Emerging Tech" },
  { id: "whiteboard_marker", name: "Whiteboard Marker", category: "Supplies" },
]

export default function ReserveRoomModal({ open, onOpenChange, userRole }: ReserveRoomModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [selectedRoom, setSelectedRoom] = useState<string>("")
  const [requestItems, setRequestItems] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [formData, setFormData] = useState({
    timeStart: "",
    timeEnd: "",
    numberOfStudents: "",
    reason: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

  const handleSubmit = () => {
    const reservationData = {
      date: date ? format(date, "yyyy-MM-dd") : "",
      timeStart: formData.timeStart,
      timeEnd: formData.timeEnd,
      roomNumber: selectedRoom,
      numberOfStudents: Number.parseInt(formData.numberOfStudents, 10),
      reason: formData.reason,
      requestItems,
      items: selectedItems,
    }

    console.log("Reservation submitted:", reservationData)

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
    })

    onOpenChange(false)
  }

  const selectedRoomData = rooms.find((room) => room.id === selectedRoom)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reserve a Room</DialogTitle>
          <DialogDescription>
            Fill in the details to request a room reservation.
            {userRole === "faculty" ? " Faculty reservations have priority." : ""}
          </DialogDescription>
        </DialogHeader>

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
                    disabled={(date) => date < new Date()}
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
                <Clock className="mr-2 h-4 w-4 text-gray-500" />
                <Input
                  id="timeStart"
                  name="timeStart"
                  type="time"
                  value={formData.timeStart}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
            </div>
          </div>

          {/* Time End */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="timeEnd" className="text-right">
              Time End *
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
                  required
                />
              </div>
            </div>
          </div>

          {/* Room Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room" className="text-right">
              Room Number *
            </Label>
            <div className="col-span-3">
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.number} - {room.description} (Capacity: {room.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Number of Students */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="numberOfStudents" className="text-right">
              Number of Students *
            </Label>
            <div className="col-span-3">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                <Input
                  id="numberOfStudents"
                  name="numberOfStudents"
                  type="number"
                  min="1"
                  max={selectedRoomData?.capacity || 50}
                  value={formData.numberOfStudents}
                  onChange={handleInputChange}
                  className="w-full"
                  required
                />
              </div>
              {selectedRoomData && (
                <p className="text-xs text-gray-500 mt-1">Maximum capacity: {selectedRoomData.capacity} students</p>
              )}
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
          {selectedRoomData && (
            <div className="grid grid-cols-4 items-start gap-4">
              <div className="text-right">
                <Label>Included Equipment</Label>
              </div>
              <div className="col-span-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Pre-included in {selectedRoomData.number}:</p>
                  <ul className="space-y-1">
                    {selectedRoomData.preIncludedEquipment.map((equipment, index) => (
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
                {additionalEquipment.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={!!selectedItems[item.id]}
                        onCheckedChange={(checked) => handleItemChange(item.id, checked as boolean)}
                      />
                      <Label htmlFor={`item-${item.id}`} className="font-normal">
                        {item.name}
                        <span className="text-gray-500 text-xs ml-1">({item.category})</span>
                      </Label>
                    </div>

                    {selectedItems[item.id] && (
                      <div className="ml-6">
                        <Label htmlFor={`quantity-${item.id}`} className="text-xs text-gray-500 mb-1 block">
                          Quantity *
                        </Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          min="1"
                          className="w-20 h-8"
                          value={selectedItems[item.id]}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </div>
                ))}
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90"
            disabled={
              !date ||
              !formData.timeStart ||
              !formData.timeEnd ||
              !selectedRoom ||
              !formData.numberOfStudents ||
              !formData.reason
            }
          >
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
