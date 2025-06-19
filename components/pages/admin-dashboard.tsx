"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Calendar,
  Clock,
  Package,
  Plus,
  Filter,
  Edit,
  Trash2,
  SortAsc,
  SortDesc,
  X,
  FileDown,
  CalendarDays,
  FileText,
  Check,
  X as XIcon,
} from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RoomCalendar from "@/components/calendar/room-calendar"
import ReservationSidebar from "@/components/reservation/reservation-sidebar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interfaces
interface User {
  user_id: number
  first_name: string
  middle_name: string
  last_name: string
  email: string
  contact_number: string
  user_role: number
  department: number
  is_active: boolean
  last_login: string
  userrole?: {
    role_name: string
  }
  department_info?: {
    department_name: string
  }
  student_number?: string
  faculty_number?: string
  year_level?: string
  section?: string
}

interface Room {
  room_id: number
  room_number: string
  room_capacity: number
  room_status: number
  is_available: boolean
  roomstatus?: {
    status_name: string
  }
}

interface InventoryItem {
  item_id: number
  item_name: string
  quantity: number
  condition_id: number
  category_id: number
  purchase_date: string
  inventorycategory?: {
    category_name: string
  }
  itemcondition?: {
    condition_name: string
  }
}

interface Reservation {
  reservation_id: number
  user_id: number
  room_id: number
  reservation_date: string
  start_time: string
  end_time: string
  room_status: number
  priority_level: number
  number_of_students: number
  purpose?: string
  equipment_needed: boolean
  file_url?: string
  approved_by: number | null
  approved_at: string | null
  created_at: string
  users?: {
    first_name: string
    middle_name: string
    last_name: string
    email: string
  }
  room?: {
    room_number: string
  }
  requestedequipment?: {
    request_equipment_id: number
    item_id: number
    quantity: number
    status: string
    inventoryitem?: {
      item_name: string
    }
  }[]
}

type SortField = string
type SortDirection = "asc" | "desc"

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "dashboard"
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeReservations: 0,
    pendingRequests: 0,
    lowStockItems: 0,
  })
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // Filter and sort states
  const [reservationFilters, setReservationFilters] = useState({
    status: "all",
    dateRange: "all",
    room: "all",
  })
  const [inventoryFilters, setInventoryFilters] = useState({
    category: "all",
    condition: "all",
    stock: "all",
  })
  const [roomFilters, setRoomFilters] = useState({
    status: "all",
  })
  const [userFilters, setUserFilters] = useState({
    role: "all",
    department: "all",
    status: "all",
  })

  // Sort states
  const [reservationSort, setReservationSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "created_at",
    direction: "desc",
  })
  const [inventorySort, setInventorySort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "item_name",
    direction: "asc",
  })
  const [roomSort, setRoomSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "room_number",
    direction: "asc",
  })
  const [userSort, setUserSort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "last_name",
    direction: "asc",
  })

  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false)
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [isEditRoomOpen, setIsEditRoomOpen] = useState(false)
  const [isEditUserOpen, setIsEditUserOpen] = useState(false)
  const [isViewReservationOpen, setIsViewReservationOpen] = useState(false)
  const [isViewUserOpen, setIsViewUserOpen] = useState(false)

  // Edit states
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)

  // Form states
  const [newItem, setNewItem] = useState({
    item_name: "",
    quantity: "",
    condition_id: "",
    category_id: "",
    purchase_date: "",
  })
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    room_capacity: "",
    room_status: "",
    is_available: true,
  })
  const [newUser, setNewUser] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    user_role: "",
    department: "",
    password: "",
    student_number: "",
    faculty_number: "",
    year_level: "",
    section: "",
  })

  // Add state for room equipment management after editingRoom state
  const [roomEquipment, setRoomEquipment] = useState<any[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentError, setEquipmentError] = useState("");
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState("");
  const [addQuantity, setAddQuantity] = useState(1);
  const [editQuantities, setEditQuantities] = useState<{ [key: string]: number }>({});
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [inventoryFetchError, setInventoryFetchError] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Add state to store all room equipment for all rooms
  const [allRoomEquipment, setAllRoomEquipment] = useState<any[]>([]);

  // Utility functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast.error("No data to export")
      return
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`${filename} exported successfully`)
  }

  const sortData = <T extends Record<string, any>>(data: T[], field: string, direction: SortDirection): T[] => {
    return [...data].sort((a, b) => {
      let aVal = a[field]
      let bVal = b[field]

      // Handle nested objects
      if (field.includes(".")) {
        const fields = field.split(".")
        aVal = fields.reduce((obj, key) => obj?.[key], a)
        bVal = fields.reduce((obj, key) => obj?.[key], b)
      }

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return direction === "asc" ? -1 : 1
      if (bVal == null) return direction === "asc" ? 1 : -1

      // Handle different data types
      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal
      }

      // Handle dates
      if (aVal instanceof Date || bVal instanceof Date || (typeof aVal === "string" && !isNaN(Date.parse(aVal)))) {
        const dateA = new Date(aVal)
        const dateB = new Date(bVal)
        return direction === "asc" ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime()
      }

      // Default string comparison
      return direction === "asc" ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal))
    })
  }

  const handleSort = (field: string, currentSort: { field: string; direction: SortDirection }, setSort: Function) => {
    const newDirection = currentSort.field === field && currentSort.direction === "asc" ? "desc" : "asc"
    setSort({ field, direction: newDirection })
  }

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      console.log("Fetching dashboard stats...")

      // Fetch active reservations
      const { data: activeReservations, error: activeError } = await supabase
        .from("reservation")
        .select("*")
        .eq("room_status", 1)

      if (activeError) throw activeError

      // Fetch pending requests
      const { data: pendingRequests, error: pendingError } = await supabase
        .from("reservation")
        .select("*")
        .eq("room_status", 3) // Use 3 for pending

      if (pendingError) throw pendingError

      // Fetch low stock items (less than 10)
      const { data: lowStock, error: lowStockError } = await supabase
        .from("inventoryitem")
        .select("*")
        .lt("quantity", 10)

      if (lowStockError) throw lowStockError

      setStats({
        activeReservations: activeReservations?.length || 0,
        pendingRequests: pendingRequests?.length || 0,
        lowStockItems: lowStock?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast.error("Failed to fetch dashboard statistics")
    }
  }

  // Fetch reservations with user and room details
  const fetchReservations = async () => {
    try {
      console.log("Fetching reservations...")
      const { data, error } = await supabase
        .from("reservation")
        .select(`
          *,
          users:user_id (
            first_name,
            middle_name,
            last_name,
            email
          ),
          room:room_id (
            room_number
          ),
          requestedequipment (
            request_equipment_id,
            item_id,
            quantity,
            status,
            inventoryitem (
              item_name
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      console.log("Fetched reservations:", data)
      setReservations(data || [])
    } catch (error) {
      console.error("Error fetching reservations:", error)
      toast.error("Failed to fetch reservations")
    }
  }

  // Fetch inventory items
  const fetchInventory = async () => {
    try {
      setInventoryFetchError("");
      // Step 1: Fetch all inventory items with quantity > 0
      const { data: items, error: itemsError } = await supabase
        .from("inventoryitem")
        .select("item_id, item_name, category_id, quantity, condition_id, purchase_date")
        .gt("quantity", 0)
        .order("item_name");
      if (itemsError) {
        setInventoryFetchError(itemsError.message || "Failed to fetch inventory items");
        setInventory([]);
        return;
      }
      // Step 2: Fetch all categories
      const { data: categories, error: categoriesError } = await supabase
        .from("inventorycategory")
        .select("category_id, category_name");
      if (categoriesError) {
        setInventoryFetchError(categoriesError.message || "Failed to fetch inventory categories");
        setInventory([]);
        return;
      }
      // Step 3: Map categories to items
      const inventoryWithCategories =
        items?.map((item) => {
          const category = categories?.find((cat) => cat.category_id === item.category_id);
          return {
            ...item,
            inventorycategory: category || { category_name: "Unknown" },
          };
        }) || [];
      setInventory(inventoryWithCategories);
      if (!inventoryWithCategories.length) {
        setInventoryFetchError("No inventory items found. Check if the table has data and RLS policies allow access.");
      }
    } catch (error) {
      setInventoryFetchError("Unexpected error fetching inventory items");
      setInventory([]);
    }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    try {
      console.log("Fetching rooms...")
      const { data, error } = await supabase.from("room").select("*").order("room_number")

      if (error) throw error
      console.log("Fetched rooms:", data)
      setRooms(data || [])
    } catch (error) {
      console.error("Error fetching rooms:", error)
      toast.error("Failed to fetch rooms")
    }
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      console.log("Fetching users...")
      const { data, error } = await supabase.from("users").select("*").order("last_name")

      if (error) throw error
      console.log("Fetched users:", data)
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to fetch users")
    }
  }

  // RESERVATION CRUD OPERATIONS
  const handleReservationStatus = async (id: number, status: number) => {
    // Get adminId from localStorage
    const adminIdString = (typeof window !== 'undefined') ? localStorage.getItem('adminId') : null;
    const adminId = adminIdString ? parseInt(adminIdString, 10) : null;
    if (!adminId) {
      toast.error('Admin ID not found. Please log in again.');
      return;
    }
    try {
      const { error } = await supabase
        .from("reservation")
        .update({
          room_status: status,
          approved_by: adminId,
          approved_at: new Date().toISOString(),
        })
        .eq("reservation_id", id)

      if (error) throw error
      toast.success("Reservation status updated successfully")
      fetchReservations()
      fetchStats()
    } catch (error) {
      let errorMsg = "";
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMsg = JSON.stringify(error);
      } else {
        errorMsg = String(error);
      }
      console.error("Error updating reservation:", errorMsg);
      toast.error(`Failed to update reservation status: ${errorMsg}`);
    }
  }

  const handleDeleteReservation = async (id: number) => {
    try {
      const { error } = await supabase.from("reservation").delete().eq("reservation_id", id)

      if (error) throw error
      toast.success("Reservation deleted successfully")
      fetchReservations()
      fetchStats()
    } catch (error) {
      console.error("Error deleting reservation:", error)
      toast.error("Failed to delete reservation")
    }
  }

  // INVENTORY CRUD OPERATIONS
  const handleAddItem = async () => {
    try {
      if (!newItem.item_name || !newItem.quantity || !newItem.condition_id || !newItem.category_id) {
        toast.error("Please fill in all required fields")
        return
      }

      const { error } = await supabase.from("inventoryitem").insert([
        {
          item_name: newItem.item_name,
          quantity: Number.parseInt(newItem.quantity),
          condition_id: Number.parseInt(newItem.condition_id),
          category_id: Number.parseInt(newItem.category_id),
          purchase_date: newItem.purchase_date || new Date().toISOString().split("T")[0],
        },
      ])

      if (error) throw error
      toast.success("Item added successfully")
      setNewItem({
        item_name: "",
        quantity: "",
        condition_id: "",
        category_id: "",
        purchase_date: "",
      })
      setIsAddItemOpen(false)
      fetchInventory()
      fetchStats()
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error("Failed to add item")
    }
  }

  const handleUpdateItem = async () => {
    try {
      if (!editingItem) return

      const { error } = await supabase
        .from("inventoryitem")
        .update({
          item_name: editingItem.item_name,
          quantity: editingItem.quantity,
          condition_id: editingItem.condition_id,
          category_id: editingItem.category_id,
          purchase_date: editingItem.purchase_date,
        })
        .eq("item_id", editingItem.item_id)

      if (error) throw error
      toast.success("Item updated successfully")
      setIsEditItemOpen(false)
      setEditingItem(null)
      fetchInventory()
      fetchStats()
    } catch (error) {
      console.error("Error updating item:", error)
      toast.error("Failed to update item")
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      const { error } = await supabase.from("inventoryitem").delete().eq("item_id", id)

      if (error) throw error
      toast.success("Item deleted successfully")
      fetchInventory()
      fetchStats()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  // ROOM CRUD OPERATIONS
  const handleAddRoom = async () => {
    try {
      if (!newRoom.room_number || !newRoom.room_capacity || !newRoom.room_status) {
        toast.error("Please fill in all required fields")
        return
      }

      const { error } = await supabase.from("room").insert([
        {
          room_number: newRoom.room_number,
          room_capacity: Number.parseInt(newRoom.room_capacity),
          room_status: Number.parseInt(newRoom.room_status),
          is_available: newRoom.is_available,
        },
      ])

      if (error) throw error
      toast.success("Room added successfully")
      setNewRoom({
        room_number: "",
        room_capacity: "",
        room_status: "",
        is_available: true,
      })
      setIsAddRoomOpen(false)
      fetchRooms()
    } catch (error) {
      console.error("Error adding room:", error)
      toast.error("Failed to add room")
    }
  }

  const handleUpdateRoom = async () => {
    try {
      if (!editingRoom) return

      const { error } = await supabase
        .from("room")
        .update({
          room_number: editingRoom.room_number,
          room_capacity: editingRoom.room_capacity,
          room_status: editingRoom.room_status,
          is_available: editingRoom.is_available,
        })
        .eq("room_id", editingRoom.room_id)

      if (error) throw error
      toast.success("Room updated successfully")
      setIsEditRoomOpen(false)
      setEditingRoom(null)
      fetchRooms()
    } catch (error) {
      console.error("Error updating room:", error)
      toast.error("Failed to update room")
    }
  }

  const handleDeleteRoom = async (id: number) => {
    try {
      // Check if room has active reservations
      const { data: activeReservations, error: checkError } = await supabase
        .from("reservation")
        .select("reservation_id")
        .eq("room_id", id)
        .eq("room_status", 1)

      if (checkError) throw checkError

      if (activeReservations && activeReservations.length > 0) {
        toast.error("Cannot delete room with active reservations")
        return
      }

      const { error } = await supabase.from("room").delete().eq("room_id", id)

      if (error) throw error
      toast.success("Room deleted successfully")
      fetchRooms()
    } catch (error) {
      console.error("Error deleting room:", error)
      toast.error("Failed to delete room")
    }
  }

  // USER CRUD OPERATIONS
  const handleAddUser = async () => {
    if (isAddingUser) return; // Prevent multiple submissions
    
    try {
      setIsAddingUser(true);
      console.log("handleAddUser called with data:", { ...newUser, password: '[REDACTED]' })
      
      // Debug validation checks
      console.log("Validation checks:")
      console.log("- first_name:", !!newUser.first_name, newUser.first_name)
      console.log("- last_name:", !!newUser.last_name, newUser.last_name)
      console.log("- email:", !!newUser.email, newUser.email)
      console.log("- user_role:", !!newUser.user_role, newUser.user_role)
      console.log("- department:", !!newUser.department, newUser.department)
      console.log("- password:", !!newUser.password, newUser.password ? "[REDACTED]" : "")
      
      if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.user_role || !newUser.department || !newUser.password) {
        console.log("Validation failed - missing required fields")
        toast.error("Please fill in all required fields")
        return
      }

      // Additional validation for role-specific fields
      if (newUser.user_role === "3" && !newUser.student_number) {
        console.log("Validation failed - student number required")
        toast.error("Student number is required for students")
        return
      }

      if (newUser.user_role === "2" && !newUser.faculty_number) {
        console.log("Validation failed - faculty number required")
        toast.error("Faculty number is required for faculty members")
        return
      }

      console.log("Validation passed, creating user...")

      // Create user record in Users table
      const userData = {
        user_role: Number.parseInt(newUser.user_role),
        first_name: newUser.first_name,
        middle_name: newUser.middle_name,
        last_name: newUser.last_name,
        department: Number.parseInt(newUser.department),
        email: newUser.email,
        contact_number: newUser.contact_number,
        password: newUser.password,
        is_active: true,
        last_login: new Date().toISOString(),
      }

      console.log("Inserting user data:", { ...userData, password: '[REDACTED]' })

      const { data: newUserRecord, error: userError } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single()

      if (userError) {
        console.error("User creation error:", userError)
        throw userError
      }

      console.log("User created successfully:", newUserRecord)

      // If user is a student, create student record
      if (newUser.user_role === "3") {
        const studentData = {
          user_id: newUserRecord.user_id,
          student_number: newUser.student_number,
          year_level: newUser.year_level || "1st Year",
          section: newUser.section || "A"
        }

        console.log("Creating student record:", studentData)

        const { error: studentError } = await supabase
          .from('student')
          .insert([studentData])

        if (studentError) {
          console.error("Student record creation error:", studentError)
          throw studentError
        }
        
        console.log("Student record created successfully")
      }

      // If user is faculty, create faculty record
      if (newUser.user_role === "2") {
        const facultyData = {
          user_id: newUserRecord.user_id,
          faculty_number: newUser.faculty_number
        }

        console.log("Creating faculty record:", facultyData)

        const { error: facultyError } = await supabase
          .from('faculty')
          .insert([facultyData])

        if (facultyError) {
          console.error("Faculty record creation error:", facultyError)
          throw facultyError
        }
        
        console.log("Faculty record created successfully")
      }

      console.log("All records created successfully")
      toast.success("User added successfully")
      setNewUser({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        contact_number: "",
        user_role: "",
        department: "",
        password: "",
        student_number: "",
        faculty_number: "",
        year_level: "",
        section: "",
      })
      setIsAddUserOpen(false)
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      let errorMessage = "Failed to add user"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }
      toast.error(errorMessage)
    } finally {
      setIsAddingUser(false);
    }
  }

  const handleUpdateUser = async () => {
    try {
      if (!editingUser) return

      const { error } = await supabase
        .from("users")
        .update({
          first_name: editingUser.first_name,
          middle_name: editingUser.middle_name,
          last_name: editingUser.last_name,
          email: editingUser.email,
          contact_number: editingUser.contact_number,
          user_role: editingUser.user_role,
          department: editingUser.department,
          is_active: editingUser.is_active,
        })
        .eq("user_id", editingUser.user_id)

      if (error) throw error
      toast.success("User updated successfully")
      setIsEditUserOpen(false)
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      console.error("Error updating user:", error)
      toast.error("Failed to update user")
    }
  }

  const handleDeleteUser = async (id: number) => {
    try {
      const { error } = await supabase.from("users").update({ is_active: false }).eq("user_id", id)

      if (error) throw error
      toast.success("User deactivated successfully")
      fetchUsers()
    } catch (error) {
      console.error("Error deactivating user:", error)
      toast.error("Failed to deactivate user")
    }
  }

  // Filter functions
  const getFilteredReservations = () => {
    const filtered = reservations.filter((reservation: any) => {
      const matchesSearch =
        reservation.reservation_id.toString().includes(searchQuery) ||
        `${reservation.users?.first_name} ${reservation.users?.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        reservation.room?.room_number.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        reservationFilters.status === "all" ||
        (reservationFilters.status === "pending" && reservation.room_status === 3) ||
        (reservationFilters.status === "approved" && reservation.room_status === 1) ||
        (reservationFilters.status === "rejected" && reservation.room_status === 2)

      const matchesRoom = reservationFilters.room === "all" || reservation.room?.room_number === reservationFilters.room

      return matchesSearch && matchesStatus && matchesRoom
    })

    return sortData(filtered, reservationSort.field, reservationSort.direction)
  }

  const getFilteredInventory = () => {
    const filtered = inventory.filter((item: any) => {
      const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory =
        inventoryFilters.category === "all" || item.category_id.toString() === inventoryFilters.category

      const matchesCondition =
        inventoryFilters.condition === "all" || item.condition_id.toString() === inventoryFilters.condition

      const matchesStock =
        inventoryFilters.stock === "all" ||
        (inventoryFilters.stock === "low" && item.quantity <= 5) ||
        (inventoryFilters.stock === "normal" && item.quantity > 5)

      return matchesSearch && matchesCategory && matchesCondition && matchesStock
    })

    return sortData(filtered, inventorySort.field, inventorySort.direction)
  }

  const getFilteredRooms = () => {
    const filtered = rooms.filter((room: any) => {
      const matchesSearch = room.room_number.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = roomFilters.status === "all" || room.room_status.toString() === roomFilters.status

      return matchesSearch && matchesStatus
    })

    return sortData(filtered, roomSort.field, roomSort.direction)
  }

  const getFilteredUsers = () => {
    const filtered = users.filter((user: any) => {
      const matchesSearch =
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchQuery.toLowerCase())

      const matchesRole = userFilters.role === "all" || user.user_role.toString() === userFilters.role

      const matchesDepartment =
        userFilters.department === "all" || user.department.toString() === userFilters.department

      const matchesStatus =
        userFilters.status === "all" ||
        (userFilters.status === "active" && user.is_active) ||
        (userFilters.status === "inactive" && !user.is_active)

      return matchesSearch && matchesRole && matchesDepartment && matchesStatus
    })

    return sortData(filtered, userSort.field, userSort.direction)
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), fetchReservations(), fetchInventory(), fetchRooms(), fetchUsers()])
      setLoading(false)
    }
    fetchData()
  }, [])

  // Fetch room equipment when editingRoom changes
  useEffect(() => {
    const fetchRoomEquipment = async () => {
      if (!editingRoom) return;
      setEquipmentLoading(true);
      setEquipmentError("");
      const { data, error } = await supabase
        .from("roomequipment")
        .select(`equipment_id, item_id, quantity, inventoryitem:item_id (item_name, quantity, category_id, condition_id, purchase_date)`)
        .eq("room_id", editingRoom.room_id);
      if (error) {
        setEquipmentError("Failed to fetch room equipment");
        setRoomEquipment([]);
      } else {
        setRoomEquipment(data || []);
        // Set initial edit quantities
        const eq: { [key: string]: number } = {};
        (data || []).forEach((item: any) => {
          eq[item.item_id] = item.quantity;
        });
        setEditQuantities(eq);
      }
      setEquipmentLoading(false);
    };
    if (isEditRoomOpen && editingRoom) fetchRoomEquipment();
  }, [isEditRoomOpen, editingRoom]);

  // Fetch all room equipment for accurate available calculation
  useEffect(() => {
    const fetchAllRoomEquipment = async () => {
      const { data, error } = await supabase
        .from("roomequipment")
        .select("item_id, quantity, room_id");
      if (!error && data) setAllRoomEquipment(data);
      else setAllRoomEquipment([]);
    };
    if (isEditRoomOpen) fetchAllRoomEquipment();
  }, [isEditRoomOpen]);

  // Robust helper to get available quantity for an item
  // For editing: available = total - assigned to other rooms + current room's assigned
  // For adding: available = total - assigned to all rooms
  const getAvailableQuantity = (item_id: number) => {
    // Debug: log the data used for calculation
    console.log("allRoomEquipment", allRoomEquipment);
    console.log("inventory", inventory);
    const total = inventory.find((i) => Number(i.item_id) === Number(item_id))?.quantity ?? 0;
    const assigned = allRoomEquipment
      .filter((eq) => Number(eq.item_id) === Number(item_id))
      .reduce((sum, eq) => sum + (eq.quantity || 0), 0);
    return total - assigned;
  };

  // Update handleAddEquipmentToRoom to refresh both after adding
  const handleAddEquipmentToRoom = async () => {
    setEquipmentError("");
    if (!editingRoom) return;
    if (!selectedEquipmentId) return;
    const selectedIdNum = Number(selectedEquipmentId);
    const item = inventory.find((i) => Number(i.item_id) === selectedIdNum);
    if (!item) return;
    if (addQuantity > getAvailableQuantity(selectedIdNum)) {
      setEquipmentError(`Not enough stock. Only ${getAvailableQuantity(selectedIdNum)} available.`);
      return;
    }
    // Insert into roomequipment
    const { error } = await supabase.from("roomequipment").insert({
      room_id: editingRoom.room_id,
      item_id: selectedIdNum,
      quantity: addQuantity,
    });
    if (error) {
      setEquipmentError("Failed to add equipment.");
      return;
    }
    // Update inventoryitem
    await supabase
      .from("inventoryitem")
      .update({ quantity: item.quantity - addQuantity })
      .eq("item_id", selectedIdNum);
    setShowAddEquipment(false);
    setSelectedEquipmentId("");
    setAddQuantity(1);
    // No need to manually refresh, useEffect will handle it
  };

  // Update handleUpdateEquipmentQuantity to refresh both after editing
  const handleUpdateEquipmentQuantity = async (item_id: number) => {
    if (!editingRoom) return;
    const newQty = editQuantities[item_id];
    const equipment = roomEquipment.find((e) => Number(e.item_id) === Number(item_id));
    if (!equipment) return;
    const available = getAvailableQuantity(item_id);
    const currentQty = equipment.quantity;
    const diff = newQty - currentQty;
    if (diff > available - currentQty) {
      setEditErrors((prev) => ({ ...prev, [item_id]: `Not enough stock. Only ${available} available.` }));
      return;
    }
    setEditErrors((prev) => ({ ...prev, [item_id]: "" }));
    // Update roomequipment
    const { error } = await supabase
      .from("roomequipment")
      .update({ quantity: newQty })
      .eq("room_id", editingRoom.room_id)
      .eq("item_id", item_id);
    if (error) {
      setEditErrors((prev) => ({ ...prev, [item_id]: "Failed to update quantity." }));
      return;
    }
    // Update inventoryitem (decrement/increment quantity)
    if (diff !== 0) {
      await supabase
        .from("inventoryitem")
        .update({ quantity: available - diff })
        .eq("item_id", item_id);
    }
    // No need to manually refresh, useEffect will handle it
  };

  const getAvailableQuantityForEdit = (item_id: number, currentRoomId: number) => {
    const total = inventory.find((i) => Number(i.item_id) === Number(item_id))?.quantity ?? 0;
    const assignedToOtherRooms = allRoomEquipment
      .filter((eq) => Number(eq.item_id) === Number(item_id) && Number(eq.room_id) !== currentRoomId)
      .reduce((sum, eq) => sum + (eq.quantity || 0), 0);
    const currentRoomAssigned = allRoomEquipment
      .find((eq) => Number(eq.item_id) === Number(item_id) && Number(eq.room_id) === currentRoomId)?.quantity || 0;
    return total - assignedToOtherRooms;
    // or: return total - assignedToOtherRooms; // since currentRoomAssigned is not subtracted
  };

  // Dashboard overview with stats
  const DashboardOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-700 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Active Reservations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{stats.activeReservations}</div>
            <p className="text-primary text-sm">Currently approved reservations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-700 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-700">{stats.pendingRequests}</div>
            <p className="text-amber-600 text-sm">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-emerald-700 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-700">{stats.lowStockItems}</div>
            <p className="text-emerald-600 text-sm">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">Recent Activity</CardTitle>
            <CardDescription>Latest system activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservations.slice(0, 5).map((reservation: any) => (
                <div key={reservation.reservation_id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
                  <Avatar className="border-2 border-gray-200">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {reservation.users?.first_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {`${reservation.users?.first_name} ${reservation.users?.last_name}`} made a reservation
                    </p>
                    <p className="text-xs text-gray-500">{new Date(reservation.created_at).toLocaleString()}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      reservation.room_status === 1
                        ? "bg-green-50 text-green-700 border-green-200"
                        : reservation.room_status === 2
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    }
                  >
                    {reservation.room_status === 1
                      ? "Approved"
                      : reservation.room_status === 2
                        ? "Rejected"
                        : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-800">System Status</CardTitle>
            <CardDescription>Overall system health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-gray-700">Database Connection</span>
                <span className="text-green-600 text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Online
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-gray-700">Reservation System</span>
                <span className="text-green-600 text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-gray-700">Notifications</span>
                <span className="text-green-600 text-sm font-medium flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Working
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                <span className="text-sm font-medium text-gray-700">Total Users</span>
                <span className="text-blue-600 text-sm font-medium">{users.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                <span className="text-sm font-medium text-gray-700">Total Rooms</span>
                <span className="text-blue-600 text-sm font-medium">{rooms.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Calendar view for admin
  const CalendarView = () => (
    <div className="space-y-6">
      <Card className="border-gray-200">
        <CardContent className="p-0">
          <RoomCalendar />
        </CardContent>
      </Card>
    </div>
  )

  // Enhanced table header with sort functionality
  const SortableTableHead = ({
    children,
    field,
    currentSort,
    onSort,
  }: {
    children: React.ReactNode
    field: string
    currentSort: { field: string; direction: SortDirection }
    onSort: (field: string) => void
  }) => (
    <TableHead className="cursor-pointer hover:bg-gray-50 select-none" onClick={() => onSort(field)}>
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {currentSort.field === field &&
          (currentSort.direction === "asc" ? (
            <SortAsc className="w-4 h-4 text-blue-600" />
          ) : (
            <SortDesc className="w-4 h-4 text-blue-600" />
          ))}
      </div>
    </TableHead>
  )

  // Reservation requests list
  const ReservationRequests = () => {
    const filteredReservations = getFilteredReservations()

    return (
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-800">Reservation Requests</CardTitle>
            <CardDescription>Manage pending reservation requests</CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={reservationFilters.status}
                      onValueChange={(value) => setReservationFilters({ ...reservationFilters, status: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Room</Label>
                    <Select
                      value={reservationFilters.room}
                      onValueChange={(value) => setReservationFilters({ ...reservationFilters, room: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Rooms</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.room_id} value={room.room_number}>
                            {room.room_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setReservationFilters({ status: "all", dateRange: "all", room: "all" })}
                  className="text-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300"
              onClick={() =>
                exportToCSV(
                  filteredReservations.map((r) => ({
                    id: r.reservation_id,
                    user: `${r.users?.first_name} ${r.users?.last_name}`,
                    email: r.users?.email,
                    room: r.room?.room_number,
                    date: r.reservation_date,
                    start_time: r.start_time,
                    end_time: r.end_time,
                    status: r.room_status === 1 ? "Approved" : r.room_status === 2 ? "Rejected" : "Pending",
                    created_at: r.created_at,
                  })),
                  "reservations",
                )
              }
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search reservations..."
                className="max-w-sm border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {(searchQuery || Object.values(reservationFilters).some((f) => f !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setReservationFilters({ status: "all", dateRange: "all", room: "all" })
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <SortableTableHead
                      field="reservation_id"
                      currentSort={reservationSort}
                      onSort={(field) => handleSort(field, reservationSort, setReservationSort)}
                    >
                      Request ID
                    </SortableTableHead>
                    <SortableTableHead
                      field="users.first_name"
                      currentSort={reservationSort}
                      onSort={(field) => handleSort(field, reservationSort, setReservationSort)}
                    >
                      User
                    </SortableTableHead>
                    <SortableTableHead
                      field="room.room_number"
                      currentSort={reservationSort}
                      onSort={(field) => handleSort(field, reservationSort, setReservationSort)}
                    >
                      Room
                    </SortableTableHead>
                    <SortableTableHead
                      field="reservation_date"
                      currentSort={reservationSort}
                      onSort={(field) => handleSort(field, reservationSort, setReservationSort)}
                    >
                      Date
                    </SortableTableHead>
                    <TableHead>Time</TableHead>
                    <SortableTableHead
                      field="priority_level"
                      currentSort={reservationSort}
                      onSort={(field) => handleSort(field, reservationSort, setReservationSort)}
                    >
                      Priority
                    </SortableTableHead>
                    <SortableTableHead
                      field="room_status"
                      currentSort={reservationSort}
                      onSort={(field) => handleSort(field, reservationSort, setReservationSort)}
                    >
                      Status
                    </SortableTableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation: any) => (
                    <TableRow key={reservation.reservation_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">REQ-{reservation.reservation_id}</TableCell>
                      <TableCell>{`${reservation.users?.first_name} ${reservation.users?.last_name}`}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {reservation.room?.room_number}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(reservation.reservation_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm text-gray-600">{`${reservation.start_time} - ${reservation.end_time}`}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getPriorityLevelText(reservation.priority_level)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            reservation.room_status === 1
                              ? "bg-green-50 text-green-700 border-green-200"
                              : reservation.room_status === 2
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {reservation.room_status === 1
                            ? "Approved"
                            : reservation.room_status === 2
                              ? "Rejected"
                              : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => {
                              setViewingReservation(reservation)
                              setIsViewReservationOpen(true)
                            }}
                          >
                            View
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Reservation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this reservation? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteReservation(reservation.reservation_id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredReservations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No reservations found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* View Reservation Dialog */}
        <Dialog open={isViewReservationOpen} onOpenChange={setIsViewReservationOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-primary">Reservation Details</DialogTitle>
              <DialogDescription>View complete reservation information</DialogDescription>
            </DialogHeader>
            {viewingReservation && (
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Request ID</Label>
                    <p className="text-sm font-medium">REQ-{viewingReservation.reservation_id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <Badge variant="outline" className="ml-2">
                      {viewingReservation.room_status === 1
                        ? "Approved"
                        : viewingReservation.room_status === 2
                          ? "Rejected"
                          : "Pending"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Reserved By</Label>
                    <p className="text-sm">{`${viewingReservation.users?.first_name} ${viewingReservation.users?.middle_name ? viewingReservation.users.middle_name + ' ' : ''}${viewingReservation.users?.last_name}`}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="text-sm">{viewingReservation.users?.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Room</Label>
                    <p className="text-sm">{viewingReservation.room?.room_number}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Date</Label>
                    <p className="text-sm">{new Date(viewingReservation.reservation_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Time</Label>
                    <p className="text-sm">{`${viewingReservation.start_time} - ${viewingReservation.end_time}`}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Number of Students</Label>
                    <p className="text-sm">{viewingReservation.number_of_students || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Priority Level</Label>
                    <div className="mt-1">
                      {getPriorityLevelBadge(viewingReservation.priority_level)}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Equipment Needed</Label>
                    <p className="text-sm">{viewingReservation.equipment_needed ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Created</Label>
                    <p className="text-sm">{new Date(viewingReservation.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Purpose */}
                {viewingReservation.purpose && (
                  <div>
                    <Label className="text-xs text-gray-500">Purpose</Label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded border">{viewingReservation.purpose}</p>
                  </div>
                )}

                {/* File Attachment */}
                <div>
                  <Label className="text-xs text-gray-500">File Attachment</Label>
                  {viewingReservation.file_url ? (
                    <div className="mt-1 p-3 bg-blue-50 rounded border">
                      <a 
                        href={viewingReservation.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Attachment
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded border text-gray-500">No attachment</p>
                  )}
                </div>

                {/* Requested Equipment */}
                {viewingReservation.equipment_needed && viewingReservation.requestedequipment && viewingReservation.requestedequipment.length > 0 && (
                  <div>
                    <Label className="text-xs text-gray-500">Requested Equipment</Label>
                    <div className="mt-2 space-y-2">
                      {viewingReservation.requestedequipment.map((equipment) => {
                        const item = inventory.find((i) => Number(i.item_id) === Number(equipment.item_id));
                        const availableStock = item ? item.quantity : 0;
                        const isPending = equipment.status === 'pending';
                        return (
                          <div key={equipment.request_equipment_id} className="p-3 bg-gray-50 rounded border">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{equipment.inventoryitem?.item_name || 'Unknown Item'}</span>
                              <span className="text-sm text-gray-600">Quantity: {equipment.quantity}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Available: {availableStock}</div>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {equipment.status}
                              </Badge>
                              {isPending && (
                                <>
                                  <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-100" title="Approve" onClick={() => handleApproveEquipment(equipment.request_equipment_id, equipment.item_id, equipment.quantity)}>
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-100" title="Reject" onClick={() => handleRejectEquipment(equipment.request_equipment_id)}>
                                    <XIcon className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Approval Information */}
                {viewingReservation.approved_by && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Approved By</Label>
                      <p className="text-sm">{viewingReservation.approved_by}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Approved At</Label>
                      <p className="text-sm">{viewingReservation.approved_at ? new Date(viewingReservation.approved_at).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Only show for pending reservations */}
                {viewingReservation.room_status === 3 && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="bg-primary hover:bg-blue-900 text-white flex-1"
                      onClick={() => {
                        handleReservationStatus(viewingReservation.reservation_id, 1)
                        setIsViewReservationOpen(false)
                      }}
                    >
                      Approve Reservation
                    </Button>
                    <Button
                      className="bg-red-500 hover:bg-red-600 text-white flex-1"
                      onClick={() => {
                        handleReservationStatus(viewingReservation.reservation_id, 2)
                        setIsViewReservationOpen(false)
                      }}
                    >
                      Reject Reservation
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Inventory management with enhanced UI
  const InventoryManagement = () => {
    const filteredInventory = getFilteredInventory()

    return (
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-800">Inventory Management</CardTitle>
            <CardDescription>Manage equipment and supplies</CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
                  <div>
                    <Label className="text-xs">Category</Label>
                    <Select
                      value={inventoryFilters.category}
                      onValueChange={(value) => setInventoryFilters({ ...inventoryFilters, category: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="1">Equipment</SelectItem>
                        <SelectItem value="2">Supplies</SelectItem>
                        <SelectItem value="3">Tools</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Condition</Label>
                    <Select
                      value={inventoryFilters.condition}
                      onValueChange={(value) => setInventoryFilters({ ...inventoryFilters, condition: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Conditions</SelectItem>
                        <SelectItem value="1">New</SelectItem>
                        <SelectItem value="2">Good</SelectItem>
                        <SelectItem value="3">Fair</SelectItem>
                        <SelectItem value="4">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Stock Level</Label>
                    <Select
                      value={inventoryFilters.stock}
                      onValueChange={(value) => setInventoryFilters({ ...inventoryFilters, stock: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="low">Low Stock (≤5)</SelectItem>
                        <SelectItem value="normal">Normal Stock (&gt;5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setInventoryFilters({ category: "all", condition: "all", stock: "all" })}
                  className="text-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300"
              onClick={() =>
                exportToCSV(
                  filteredInventory.map((item) => ({
                    id: item.item_id,
                    name: item.item_name,
                    quantity: item.quantity,
                    category: item.category_id === 1 ? "Equipment" : item.category_id === 2 ? "Supplies" : "Tools",
                    condition:
                      item.condition_id === 1
                        ? "New"
                        : item.condition_id === 2
                          ? "Good"
                          : item.condition_id === 3
                            ? "Fair"
                            : "Poor",
                    purchase_date: item.purchase_date,
                  })),
                  "inventory",
                )
              }
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-primary  hover:bg-blue-700 text-white"
              size="sm"
              onClick={() => setIsAddItemOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search inventory..."
                className="max-w-sm border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {(searchQuery || Object.values(inventoryFilters).some((f) => f !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setInventoryFilters({ category: "all", condition: "all", stock: "all" })
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <SortableTableHead
                      field="item_id"
                      currentSort={inventorySort}
                      onSort={(field) => handleSort(field, inventorySort, setInventorySort)}
                    >
                      Item ID
                    </SortableTableHead>
                    <SortableTableHead
                      field="item_name"
                      currentSort={inventorySort}
                      onSort={(field) => handleSort(field, inventorySort, setInventorySort)}
                    >
                      Name
                    </SortableTableHead>
                    <SortableTableHead
                      field="category_id"
                      currentSort={inventorySort}
                      onSort={(field) => handleSort(field, inventorySort, setInventorySort)}
                    >
                      Category
                    </SortableTableHead>
                    <SortableTableHead
                      field="quantity"
                      currentSort={inventorySort}
                      onSort={(field) => handleSort(field, inventorySort, setInventorySort)}
                    >
                      Quantity
                    </SortableTableHead>
                    <SortableTableHead
                      field="condition_id"
                      currentSort={inventorySort}
                      onSort={(field) => handleSort(field, inventorySort, setInventorySort)}
                    >
                      Condition
                    </SortableTableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item: any) => (
                    <TableRow key={item.item_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">INV-{item.item_id}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {item.category_id === 1
                            ? "Equipment"
                            : item.category_id === 2
                              ? "Supplies"
                              : item.category_id === 3
                                ? "Tools"
                                : "Other"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${item.quantity <= 5 ? "text-red-600" : "text-gray-900"}`}>
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.condition_id === 1
                              ? "bg-green-50 text-green-700 border-green-200"
                              : item.condition_id === 2
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : item.condition_id === 3
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {item.condition_id === 1
                            ? "New"
                            : item.condition_id === 2
                              ? "Good"
                              : item.condition_id === 3
                                ? "Fair"
                                : "Poor"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.quantity <= 5 ? "destructive" : "outline"}>
                          {item.quantity <= 5 ? "Low Stock" : "In Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => {
                              setEditingItem(item)
                              setIsEditItemOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this item? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteItem(item.item_id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredInventory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No inventory items found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Add Item Dialog */}
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Item</DialogTitle>
              <DialogDescription>Add a new item to the inventory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item_name">Name *</Label>
                <Input
                  id="item_name"
                  value={newItem.item_name}
                  onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  placeholder="Enter item name"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={newItem.condition_id}
                  onValueChange={(value) => setNewItem({ ...newItem, condition_id: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">New</SelectItem>
                    <SelectItem value="2">Good</SelectItem>
                    <SelectItem value="3">Fair</SelectItem>
                    <SelectItem value="4">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={newItem.category_id}
                  onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Equipment</SelectItem>
                    <SelectItem value="2">Supplies</SelectItem>
                    <SelectItem value="3">Tools</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={newItem.purchase_date}
                  onChange={(e) => setNewItem({ ...newItem, purchase_date: e.target.value })}
                  className="border-gray-300"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddItem} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Add Item
                </Button>
                <Button variant="outline" onClick={() => setIsAddItemOpen(false)} className="border-gray-300">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Item Dialog */}
        <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Update item information</DialogDescription>
            </DialogHeader>
            {editingItem && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_item_name">Name *</Label>
                  <Input
                    id="edit_item_name"
                    value={editingItem.item_name}
                    onChange={(e) => setEditingItem({ ...editingItem, item_name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_quantity">Quantity *</Label>
                  <Input
                    id="edit_quantity"
                    type="number"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number.parseInt(e.target.value) })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_condition">Condition *</Label>
                  <Select
                    value={editingItem.condition_id.toString()}
                    onValueChange={(value) => setEditingItem({ ...editingItem, condition_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">New</SelectItem>
                      <SelectItem value="2">Good</SelectItem>
                      <SelectItem value="3">Fair</SelectItem>
                      <SelectItem value="4">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_category">Category *</Label>
                  <Select
                    value={editingItem.category_id.toString()}
                    onValueChange={(value) => setEditingItem({ ...editingItem, category_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Equipment</SelectItem>
                      <SelectItem value="2">Supplies</SelectItem>
                      <SelectItem value="3">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_purchase_date">Purchase Date</Label>
                  <Input
                    id="edit_purchase_date"
                    type="date"
                    value={editingItem.purchase_date?.split("T")[0] || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, purchase_date: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateItem} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Update Item
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditItemOpen(false)} className="border-gray-300">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Rooms management with enhanced UI
  const RoomsManagement = () => {
    const filteredRooms = getFilteredRooms()

    return (
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-800">Rooms Management</CardTitle>
            <CardDescription>Manage laboratory rooms and facilities</CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={roomFilters.status}
                      onValueChange={(value) => setRoomFilters({ ...roomFilters, status: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="1">Available for Booking</SelectItem>
                        <SelectItem value="2">Under Maintenance</SelectItem>
                        <SelectItem value="3">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setRoomFilters({ status: "all" })}
                  className="text-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300"
              onClick={() =>
                exportToCSV(
                  filteredRooms.map((room) => ({
                    id: room.room_id,
                    number: room.room_number,
                    capacity: room.room_capacity,
                    status: room.room_status === 1 ? "Available" : room.room_status === 2 ? "Maintenance" : "Occupied",
                    is_available: room.is_available ? "Yes" : "No",
                  })),
                  "rooms",
                )
              }
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-primary hover:bg-blue-700 text-white"
              size="sm"
              onClick={() => setIsAddRoomOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search rooms..."
                className="max-w-sm border-gray-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {(searchQuery || Object.values(roomFilters).some((f) => f !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setRoomFilters({ status: "all" })
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <SortableTableHead
                      field="room_id"
                      currentSort={roomSort}
                      onSort={(field) => handleSort(field, roomSort, setRoomSort)}
                    >
                      Room ID
                    </SortableTableHead>
                    <SortableTableHead
                      field="room_number"
                      currentSort={roomSort}
                      onSort={(field) => handleSort(field, roomSort, setRoomSort)}
                    >
                      Number
                    </SortableTableHead>
                    <SortableTableHead
                      field="room_capacity"
                      currentSort={roomSort}
                      onSort={(field) => handleSort(field, roomSort, setRoomSort)}
                    >
                      Capacity
                    </SortableTableHead>
                    <SortableTableHead
                      field="room_status"
                      currentSort={roomSort}
                      onSort={(field) => handleSort(field, roomSort, setRoomSort)}
                    >
                      Room Status
                    </SortableTableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.map((room: any) => (
                    <TableRow key={room.room_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">RM-{room.room_id}</TableCell>
                      <TableCell className="font-medium">{room.room_number}</TableCell>
                      <TableCell>{room.room_capacity} people</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            room.room_status === 1
                              ? "bg-green-50 text-green-700 border-green-200"
                              : room.room_status === 2
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {room.room_status === 1
                            ? "Available for Booking"
                            : room.room_status === 2
                              ? "Under Maintenance"
                              : room.room_status === 3
                                ? "Unavailable"
                                : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => {
                              setEditingRoom(room)
                              setIsEditRoomOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Room</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this room? This action cannot be undone and will
                                  affect any existing reservations.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRoom(room.room_id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredRooms.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No rooms found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Add Room Dialog */}
        <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>Add a new room to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="room_number">Room Number *</Label>
                <Input
                  id="room_number"
                  value={newRoom.room_number}
                  onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                  placeholder="Enter room number"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="room_capacity">Capacity *</Label>
                <Input
                  id="room_capacity"
                  type="number"
                  value={newRoom.room_capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, room_capacity: e.target.value })}
                  placeholder="Enter room capacity"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="room_status">Status *</Label>
                <Select
                  value={newRoom.room_status}
                  onValueChange={(value) => setNewRoom({ ...newRoom, room_status: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Available for Booking</SelectItem>
                    <SelectItem value="2">Under Maintenance</SelectItem>
                    <SelectItem value="3">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_available"
                  checked={newRoom.is_available}
                  onCheckedChange={(checked) => setNewRoom({ ...newRoom, is_available: checked })}
                />
                <Label htmlFor="is_available">Available for booking</Label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddRoom} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  Add Room
                </Button>
                <Button variant="outline" onClick={() => setIsAddRoomOpen(false)} className="border-gray-300">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Room Dialog */}
        <Dialog open={isEditRoomOpen} onOpenChange={setIsEditRoomOpen}>
          <DialogContent className="max-w-2xl w-full h-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Room</DialogTitle>
              <DialogDescription>Update room information and manage assigned equipment</DialogDescription>
            </DialogHeader>
            {editingRoom && (
              <div className="space-y-6 overflow-y-auto h-[500px] pr-2">
                {/* Room Info Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit_room_number">Room Number *</Label>
                    <Input
                      id="edit_room_number"
                      value={editingRoom.room_number}
                      onChange={(e) => setEditingRoom({ ...editingRoom, room_number: e.target.value })}
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_room_capacity">Capacity *</Label>
                    <Input
                      id="edit_room_capacity"
                      type="number"
                      value={editingRoom.room_capacity}
                      onChange={(e) => setEditingRoom({ ...editingRoom, room_capacity: Number.parseInt(e.target.value) })}
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_room_status">Status *</Label>
                    <Select
                      value={editingRoom.room_status.toString()}
                      onValueChange={(value) => setEditingRoom({ ...editingRoom, room_status: Number.parseInt(value) })}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Available for Booking</SelectItem>
                        <SelectItem value="2">Under Maintenance</SelectItem>
                        <SelectItem value="3">Unavailable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Equipment Management Section */}
                <div className="border rounded p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="font-semibold text-lg">Room Equipment</Label>
                    <Button size="sm" variant="outline" onClick={() => setShowAddEquipment((v) => !v)}>
                      Add Equipment
                    </Button>
                  </div>
                  {equipmentLoading ? (
                    <div>Loading...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead>Edit Quantity</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roomEquipment.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-gray-500">No equipment assigned.</TableCell>
                            </TableRow>
                          )}
                          {roomEquipment.map((eq) => {
                            // For editing, add back the current room's assigned quantity
                            const available = getAvailableQuantity(eq.item_id);
                            return (
                              <TableRow key={eq.item_id}>
                                <TableCell className="font-medium">{eq.inventoryitem?.item_name || eq.item_id}</TableCell>
                                <TableCell>{eq.inventoryitem?.inventorycategory?.category_name || "-"}</TableCell>
                                <TableCell>{eq.quantity}</TableCell>
                                <TableCell>{available}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={1}
                                      max={available}
                                      value={editQuantities[eq.item_id] ?? eq.quantity}
                                      onChange={(e) => setEditQuantities((prev) => ({ ...prev, [eq.item_id]: Number(e.target.value) }))}
                                      className={editErrors[eq.item_id] ? "border-red-500" : ""}
                                      style={{ width: 80 }}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleUpdateEquipmentQuantity(eq.item_id)}
                                      disabled={editQuantities[eq.item_id] === eq.quantity}
                                    >
                                      Save
                                    </Button>
                                    {editErrors[eq.item_id] && <span className="text-xs text-red-600">{editErrors[eq.item_id]}</span>}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {/* Add Equipment Form */}
                  {showAddEquipment && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex flex-col md:flex-row items-center gap-2">
                        <Select
                          value={selectedEquipmentId}
                          onValueChange={setSelectedEquipmentId}
                        >
                          <SelectTrigger className="w-56">
                            <SelectValue placeholder="Select equipment" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.filter((i) => {
                              // For adding, do not add back current room's assigned quantity
                              const availableToAdd = getAvailableQuantity(i.item_id);
                              return !roomEquipment.some((eq) => eq.item_id === i.item_id) && availableToAdd > 0;
                            }).map((item) => {
                              const availableToAdd = getAvailableQuantity(item.item_id);
                              return (
                                <SelectItem key={item.item_id} value={item.item_id.toString()}>{item.item_name} (Available: {availableToAdd})</SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={1}
                          max={selectedEquipmentId ? getAvailableQuantity(Number(selectedEquipmentId)) : 1}
                          value={addQuantity}
                          onChange={(e) => setAddQuantity(Number(e.target.value))}
                          style={{ width: 80 }}
                          placeholder="Qty"
                        />
                        <Button size="sm" onClick={handleAddEquipmentToRoom}>Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowAddEquipment(false)}>Cancel</Button>
                      </div>
                      {equipmentError && <div className="text-xs text-red-600 mt-1">{equipmentError}</div>}
                    </div>
                  )}
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button onClick={handleUpdateRoom} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Update Room
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditRoomOpen(false)} className="border-gray-300">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Users management with enhanced UI
  const UsersManagement = () => {
    const filteredUsers = getFilteredUsers()

    // Fetch and show user details with student/faculty number
    const handleViewUser = async (user: User) => {
      let extraData: Partial<User> = {};
      if (user.user_role === 3) { // Student
        const { data } = await supabase
          .from('student')
          .select('student_number')
          .eq('user_id', user.user_id)
          .single();
        extraData.student_number = data?.student_number || '';
      } else if (user.user_role === 2) { // Faculty
        const { data } = await supabase
          .from('faculty')
          .select('faculty_number')
          .eq('user_id', user.user_id)
          .single();
        extraData.faculty_number = data?.faculty_number || '';
      }
      setViewingUser({ ...user, ...extraData });
      setIsViewUserOpen(true);
    };

    return (
      <Card className="border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-gray-800">Users Management</CardTitle>
            <CardDescription>Manage system users and permissions</CardDescription>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-2">
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Select
                      value={userFilters.role}
                      onValueChange={(value) => setUserFilters({ ...userFilters, role: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="1">Admin</SelectItem>
                        <SelectItem value="2">Faculty</SelectItem>
                        <SelectItem value="3">Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Department</Label>
                    <Select
                      value={userFilters.department}
                      onValueChange={(value) => setUserFilters({ ...userFilters, department: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="1">CS</SelectItem>
                        <SelectItem value="2">IT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={userFilters.status}
                      onValueChange={(value) => setUserFilters({ ...userFilters, status: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setUserFilters({ role: "all", department: "all", status: "all" })}
                  className="text-center justify-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-300"
              onClick={() =>
                exportToCSV(
                  filteredUsers.map((user) => ({
                    id: user.user_id,
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email,
                    role: user.user_role === 1 ? "Admin" : user.user_role === 2 ? "Faculty" : "Student",
                    department: user.department === 1 ? "CS" : user.department === 2 ? "IT" : "Unknown",
                    status: user.is_active ? "Active" : "Inactive",
                    contact: user.contact_number,
                    last_login: user.last_login,
                  })),
                  "users",
                )
              }
            >
              <FileDown className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              className="bg-primary hover:bg-blue-700 text-white"
              size="sm"
              onClick={() => setIsAddUserOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search users..."
                className="max-w-sm border-gray-300"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
              {(userSearchQuery || Object.values(userFilters).some((f) => f !== "all")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUserSearchQuery("")
                    setUserFilters({ role: "all", department: "all", status: "all" })
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <SortableTableHead
                      field="first_name"
                      currentSort={userSort}
                      onSort={(field) => handleSort(field, userSort, setUserSort)}
                    >
                      User
                    </SortableTableHead>
                    <SortableTableHead
                      field="user_role"
                      currentSort={userSort}
                      onSort={(field) => handleSort(field, userSort, setUserSort)}
                    >
                      Role
                    </SortableTableHead>
                    <SortableTableHead
                      field="department"
                      currentSort={userSort}
                      onSort={(field) => handleSort(field, userSort, setUserSort)}
                    >
                      Department
                    </SortableTableHead>
                    <SortableTableHead
                      field="is_active"
                      currentSort={userSort}
                      onSort={(field) => handleSort(field, userSort, setUserSort)}
                    >
                      Status
                    </SortableTableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user: any) => (
                    <TableRow key={user.user_id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="border-2 border-gray-200">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {user.first_name?.[0]}
                              {user.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{`${user.first_name} ${user.last_name}`}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.user_role === 1
                              ? "bg-red-50 text-red-700 border-red-200"
                              : user.user_role === 2
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-green-50 text-green-700 border-green-200"
                          }
                        >
                          {user.user_role === 1
                            ? "Admin"
                            : user.user_role === 2
                              ? "Faculty"
                              : user.user_role === 3
                                ? "Student"
                                : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                          {user.department === 1
                            ? "CS"
                            : user.department === 2
                              ? "IT"
                              : "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? "outline" : "destructive"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => handleViewUser(user)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                            onClick={() => {
                              setEditingUser({ ...user }) // clone to decouple from users array
                              setIsEditUserOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to deactivate this user? They will no longer be able to access
                                  the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteUser(user.user_id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No users found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>

        {/* Add User Dialog */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Add a new user to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div>
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  placeholder="Enter first name"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="middle_name">Middle Name</Label>
                <Input
                  id="middle_name"
                  value={newUser.middle_name}
                  onChange={(e) => setNewUser({ ...newUser, middle_name: e.target.value })}
                  placeholder="Enter middle name"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  placeholder="Enter last name"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  value={newUser.contact_number}
                  onChange={(e) => setNewUser({ ...newUser, contact_number: e.target.value })}
                  placeholder="Enter contact number"
                  className="border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="user_role">Role *</Label>
                <Select
                  value={newUser.user_role}
                  onValueChange={(value) => setNewUser({ ...newUser, user_role: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Admin</SelectItem>
                    <SelectItem value="2">Faculty</SelectItem>
                    <SelectItem value="3">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department *</Label>
                <Select
                  value={newUser.department}
                  onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">CS</SelectItem>
                    <SelectItem value="2">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student-specific fields */}
              {newUser.user_role === "3" && (
                <>
                  <div>
                    <Label htmlFor="student_number">Student Number *</Label>
                    <Input
                      id="student_number"
                      value={newUser.student_number}
                      onChange={(e) => setNewUser({ ...newUser, student_number: e.target.value })}
                      placeholder="e.g., 2024-12345-MN-0"
                      className="border-gray-300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="year_level">Year Level</Label>
                    <Select
                      value={newUser.year_level}
                      onValueChange={(value) => setNewUser({ ...newUser, year_level: value })}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Select year level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      value={newUser.section}
                      onChange={(e) => setNewUser({ ...newUser, section: e.target.value })}
                      placeholder="e.g., A, B, C"
                      className="border-gray-300"
                    />
                  </div>
                </>
              )}

              {/* Faculty-specific fields */}
              {newUser.user_role === "2" && (
                <div>
                  <Label htmlFor="faculty_number">Faculty Number *</Label>
                  <Input
                    id="faculty_number"
                    value={newUser.faculty_number}
                    onChange={(e) => setNewUser({ ...newUser, faculty_number: e.target.value })}
                    placeholder="e.g., 01234"
                    className="border-gray-300"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    console.log("Add User button clicked")
                    handleAddUser()
                  }} 
                  disabled={isAddingUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isAddingUser ? "Adding User..." : "Add User"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddUserOpen(false)} 
                  disabled={isAddingUser}
                  className="border-gray-300"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div>
                  <Label htmlFor="edit_first_name">First Name *</Label>
                  <Input
                    id="edit_first_name"
                    value={editingUser.first_name}
                    onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_middle_name">Middle Name</Label>
                  <Input
                    id="edit_middle_name"
                    value={editingUser.middle_name}
                    onChange={(e) => setEditingUser({ ...editingUser, middle_name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_last_name">Last Name *</Label>
                  <Input
                    id="edit_last_name"
                    value={editingUser.last_name}
                    onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_email">Email *</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_contact_number">Contact Number</Label>
                  <Input
                    id="edit_contact_number"
                    value={editingUser.contact_number}
                    onChange={(e) => setEditingUser({ ...editingUser, contact_number: e.target.value })}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <Label htmlFor="edit_user_role">Role *</Label>
                  <Select
                    value={editingUser.user_role.toString()}
                    onValueChange={(value) => setEditingUser({ ...editingUser, user_role: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Admin</SelectItem>
                      <SelectItem value="2">Faculty</SelectItem>
                      <SelectItem value="3">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit_department">Department *</Label>
                  <Select
                    value={editingUser.department.toString()}
                    onValueChange={(value) => setEditingUser({ ...editingUser, department: Number.parseInt(value) })}
                  >
                    <SelectTrigger className="border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">CS</SelectItem>
                      <SelectItem value="2">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit_is_active"
                    checked={editingUser.is_active}
                    onCheckedChange={(checked) => setEditingUser({ ...editingUser, is_active: checked })}
                  />
                  <Label htmlFor="edit_is_active">Active user</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateUser} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Update User
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditUserOpen(false)} className="border-gray-300">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View User Dialog */}
        <Dialog open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
          <DialogContent className="max-w-2xl w-full h-[500px] flex flex-col">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>View complete user information</DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                {/* User Avatar and Name */}
                <div className="flex items-center space-x-4 pb-4 border-b">
                  <Avatar className="border-2 border-gray-200 h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                      {viewingUser.first_name?.[0]}
                      {viewingUser.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{`${viewingUser.first_name} ${viewingUser.middle_name ? viewingUser.middle_name + ' ' : ''}${viewingUser.last_name}`}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                      <span>User ID: <span className="font-semibold text-gray-900">{viewingUser.user_id}</span></span>
                      {viewingUser.user_role === 3 && (
                        <span>Student No: <span className="font-semibold text-blue-700">{viewingUser.student_number || 'N/A'}</span></span>
                      )}
                      {viewingUser.user_role === 2 && (
                        <span>Faculty No: <span className="font-semibold text-green-700">{viewingUser.faculty_number || 'N/A'}</span></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* User Info Grid - Dynamic by Role */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Role</Label>
                    <p className="text-sm font-medium mt-1">{viewingUser.user_role === 1 ? 'Admin' : viewingUser.user_role === 2 ? 'Faculty' : viewingUser.user_role === 3 ? 'Student' : 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Department</Label>
                    <p className="text-sm font-medium mt-1">{viewingUser.department === 1 ? 'CS' : viewingUser.department === 2 ? 'IT' : 'Unknown'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <div className={`text-sm font-semibold mt-1 ${viewingUser.is_active ? 'text-green-600' : 'text-gray-500'}`}>{viewingUser.is_active ? 'Active' : 'Inactive'}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Last Login</Label>
                    <p className="text-sm font-medium mt-1">{viewingUser.last_login ? new Date(viewingUser.last_login).toLocaleString() : 'Never logged in'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="text-sm font-medium mt-1 break-all">{viewingUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Contact Number</Label>
                    <p className="text-sm font-medium mt-1">{viewingUser.contact_number || 'Not provided'}</p>
                  </div>
                  {/* Student-specific fields */}
                  {viewingUser.user_role === 3 && (
                    <>
                      <div>
                        <Label className="text-xs text-gray-500">Year Level</Label>
                        <p className="text-sm font-medium mt-1">{viewingUser.year_level || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Section</Label>
                        <p className="text-sm font-medium mt-1">{viewingUser.section || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {/* Faculty-specific fields (add more if needed) */}
                  {/* Admins: no extra fields */}
                </div>

                {/* Permission Management */}
                {(viewingUser.user_role === 1 || viewingUser.user_role === 2) && (
                  <div className="pt-2 border-t mt-2">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">Permission Management</h4>
                    <Button
                      className="bg-primary hover:bg-blue-900 text-white w-full"
                      onClick={() => {/* TODO: Implement permission management logic */}}
                    >
                      Manage Permissions
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  const getPriorityLevelText = (priorityLevel: number): string => {
    switch (priorityLevel) {
      case 1:
        return "High Priority"
      case 2:
        return "Moderate Priority"
      case 3:
        return "Medium Priority"
      case 4:
        return "Low Priority"
      default:
        return "Not specified"
    }
  }

  const getPriorityLevelBadge = (priorityLevel: number) => {
    const text = getPriorityLevelText(priorityLevel)
    let className = "text-xs px-2 py-1 rounded font-semibold"
    let colorClass = ""
    if (priorityLevel === 1) {
      colorClass = "bg-red-100 text-red-700 border border-red-300"
    } else if (priorityLevel === 2 || priorityLevel === 3) {
      colorClass = "bg-blue-100 text-blue-700 border border-blue-300"
    } else {
      colorClass = "bg-gray-100 text-gray-700 border border-gray-300"
    }
    return (
      <span className={`${className} ${colorClass}`}>{text}</span>
    )
  }

  // Add at the top-level of AdminDashboard (inside the component, after other handlers):
  const handleApproveEquipment = async (requestEquipmentId: number, itemId: number, quantity: number) => {
    const item = inventory.find((i) => Number(i.item_id) === Number(itemId));
    if (!item) {
      toast.error('Inventory item not found');
      return;
    }
    if (item.quantity < quantity) {
      toast.error('Not enough stock to approve this request');
      return;
    }
    const { error } = await supabase
      .from('requestedequipment')
      .update({ status: 'approved' })
      .eq('request_equipment_id', requestEquipmentId);
    if (error) {
      toast.error('Failed to approve equipment request');
      return;
    }
    await supabase
      .from('inventoryitem')
      .update({ quantity: item.quantity - quantity })
      .eq('item_id', itemId);
    toast.success('Equipment approved');
    fetchReservations();
    fetchInventory();
  };

  const handleRejectEquipment = async (requestEquipmentId: number) => {
    const { error } = await supabase
      .from('requestedequipment')
      .update({ status: 'rejected' })
      .eq('request_equipment_id', requestEquipmentId);
    if (error) {
      toast.error('Failed to reject equipment request');
      return;
    }
    toast.success('Equipment rejected');
    fetchReservations();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 bg-gray-50 min-h-screen outline outline-gray-200 outline-2 rounded-md">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage reservations, requests, and inventory</p>
          </div>

          <Tabs value={currentTab} onValueChange={(value) => router.push(`?tab=${value}`)} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-white border border-gray-200">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                Calendar
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                Requests
              </TabsTrigger>
              <TabsTrigger
                value="inventory"
                className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
              >
                Inventory
              </TabsTrigger>
              <TabsTrigger value="rooms" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                Rooms
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarView />
            </TabsContent>

            <TabsContent value="requests">
              <ReservationRequests />
            </TabsContent>

            <TabsContent value="inventory">
              <InventoryManagement />
            </TabsContent>

            <TabsContent value="rooms">
              <RoomsManagement />
            </TabsContent>

            <TabsContent value="users">
              <UsersManagement />
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </DashboardLayout>
  )
}

