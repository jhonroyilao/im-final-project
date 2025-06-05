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
import { CalendarIcon, Clock, Search } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

interface FindRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock data for equipment
const equipmentItems = [
  { id: "1", name: "Desktop Computer", category: "Hardware" },
  { id: "2", name: "Projector", category: "Audio/Visual" },
  { id: "3", name: "Webcam", category: "Audio/Visual" },
  { id: "4", name: "Arduino Kit", category: "Development" },
  { id: "5", name: "VR Headset", category: "Emerging Tech" },
]

// Mock data for available rooms
const availableRooms = [
  {
    id: "1",
    number: "S501",
    capacity: 30,
    description: "Computer Laboratory 1 - Programming Lab",
    equipment: ["Desktop Computer", "Projector"],
  },
  {
    id: "3",
    number: "S503",
    capacity: 35,
    description: "Computer Laboratory 3 - Database Lab",
    equipment: ["Desktop Computer", "Projector", "Webcam"],
  },
  {
    id: "6",
    number: "S506",
    capacity: 32,
    description: "Computer Laboratory 6 - AI/ML Lab",
    equipment: ["Desktop Computer", "Projector", "VR Headset"],
  },
]

export default function FindRoomModal({ open, onOpenChange }: FindRoomModalProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [formData, setFormData] = useState({
    timeStart: "08:00",
    timeEnd: "10:00",
  })
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [searchResults, setSearchResults] = useState<typeof availableRooms | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEquipmentChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedEquipment((prev) => [...prev, itemId])
    } else {
      setSelectedEquipment((prev) => prev.filter((id) => id !== itemId))
    }
  }

  const handleSearch = () => {
    // In a real app, this would search for available rooms based on criteria
    // For now, we'll just set the mock data
    setSearchResults(availableRooms)
  }

  const handleReserve = (roomId: string) => {
    // In a real app, this would open the reservation modal with the selected room
    console.log(`Reserve room ${roomId}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Find Available Room</DialogTitle>
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
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
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

          {/* Required Equipment */}
          <div className="grid grid-cols-4 items-start gap-4">
            <div className="text-right">
              <Label>Required Equipment</Label>
            </div>
            <div className="col-span-3 grid grid-cols-2 gap-3">
              {equipmentItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`equipment-${item.id}`}
                    checked={selectedEquipment.includes(item.id)}
                    onCheckedChange={(checked) => handleEquipmentChange(item.id, checked as boolean)}
                  />
                  <Label htmlFor={`equipment-${item.id}`} className="font-normal text-sm">
                    {item.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSearch} className="bg-ccis-blue hover:bg-ccis-blue/90">
            <Search className="w-4 h-4 mr-2" />
            Find Rooms
          </Button>
        </DialogFooter>

        {/* Search Results */}
        {searchResults && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Available Rooms</h3>
            <div className="space-y-4">
              {searchResults.map((room) => (
                <Card key={room.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">Room {room.number}</h3>
                        <p className="text-sm text-gray-500">{room.description}</p>
                        <p className="text-sm text-gray-500 mt-1">Capacity: {room.capacity} students</p>
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
                      </div>
                      <Button
                        size="sm"
                        className="bg-ccis-blue hover:bg-ccis-blue/90"
                        onClick={() => handleReserve(room.id)}
                      >
                        Reserve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
