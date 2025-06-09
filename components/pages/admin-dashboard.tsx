"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Package, BarChart3, Search, Users, Building2, Plus, Filter, Download } from "lucide-react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import RoomCalendar from "@/components/calendar/room-calendar"
import ReservationSidebar from "@/components/reservation/reservation-sidebar"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add these interfaces at the top of the file, after the imports
interface User {
  user_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  user_role: number;
  department: number;
  is_active: boolean;
  last_login: string;
  userrole?: {
    role_name: string;
  };
  department_info?: {
    department_name: string;
  };
}

interface Room {
  room_id: number;
  room_number: string;
  room_capacity: number;
  room_status: number;
  is_available: boolean;
  roomstatus?: {
    status_name: string;
  };
}

interface InventoryItem {
  item_id: number;
  item_name: string;
  quantity: number;
  condition_id: number;
  category_id: number;
  purchase_date: string;
  inventorycategory?: {
    category_name: string;
  };
  itemcondition?: {
    condition_name: string;
  };
}

interface Reservation {
  reservation_id: number;
  user_id: number;
  room_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  room_status: number;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  users?: {
    first_name: string;
    middle_name: string;
    last_name: string;
    email: string;
  };
  room?: {
    room_number: string;
  };
}

export default function AdminDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab") || "dashboard"
  const [showFindModal, setShowFindModal] = useState(false)
  const [showReserveModal, setShowReserveModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeReservations: 0,
    pendingRequests: 0,
    lowStockItems: 0
  })
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Form states
  const [newItem, setNewItem] = useState({
    item_name: "",
    quantity: "",
    condition_id: "",
    category_id: "",
    purchase_date: ""
  })
  const [newRoom, setNewRoom] = useState({
    room_number: "",
    room_capacity: "",
    room_status: "",
    is_available: true
  })
  const [newUser, setNewUser] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    contact_number: "",
    user_role: "",
    department: "",
    password: ""
  })

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      
      // Fetch active reservations
      const { data: activeReservations, error: activeError } = await supabase
        .from('reservation')
        .select('*')
        .eq('room_status', 1);
      
      if (activeError) throw activeError;
      console.log('Active reservations:', activeReservations);

      // Fetch pending requests
      const { data: pendingRequests, error: pendingError } = await supabase
        .from('reservation')
        .select('*')
        .eq('room_status', 0);
      
      if (pendingError) throw pendingError;
      console.log('Pending requests:', pendingRequests);

      // Fetch low stock items
      const { data: lowStock, error: lowStockError } = await supabase
        .from('inventoryitem')
        .select('*')
        .lt('quantity', 5);
      
      if (lowStockError) throw lowStockError;
      console.log('Low stock items:', lowStock);

      setStats({
        activeReservations: activeReservations?.length || 0,
        pendingRequests: pendingRequests?.length || 0,
        lowStockItems: lowStock?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error("Failed to fetch dashboard statistics");
    }
  };

  // Fetch reservations with user and room details
  const fetchReservations = async () => {
    try {
      console.log('Fetching reservations...');
      const { data, error } = await supabase
        .from('reservation')
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
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched reservations:', data);
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error("Failed to fetch reservations");
    }
  };

  // Fetch inventory items with category and condition
  const fetchInventory = async () => {
    try {
      console.log('Attempting to fetch inventory...');
      
      // Try to fetch inventory with detailed error handling
      const { data, error } = await supabase
        .from('inventoryitem')
        .select('*')
        .limit(1); // Try to fetch just one record first

      if (error) {
        console.error('Error fetching inventory:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Try alternative table name
        const { data: altData, error: altError } = await supabase
          .from('inventory_item')
          .select('*')
          .limit(1);

        if (altError) {
          console.error('Error fetching from alternative table:', {
            message: altError.message,
            details: altError.details,
            hint: altError.hint,
            code: altError.code
          });
          throw new Error('Could not access inventory table. Please check table name and permissions.');
        }

        console.log('Successfully fetched from alternative table:', altData);
        setInventory(altData || []);
        return;
      }

      console.log('Successfully fetched inventory:', data);
      setInventory(data || []);
    } catch (error) {
      console.error('Error in fetchInventory:', error);
      toast.error("Failed to fetch inventory items. Please check console for details.");
    }
  };

  // Fetch rooms with status
  const fetchRooms = async () => {
    try {
      console.log('Fetching rooms...');
      // Fetch rooms with a simpler query
      const { data, error } = await supabase
        .from('room')
        .select('*')
        .order('room_number');

      if (error) {
        console.error('Error fetching rooms:', error);
        throw error;
      }

      console.log('Fetched rooms:', data);
      setRooms(data || []);
    } catch (error) {
      console.error('Error in fetchRooms:', error);
      toast.error("Failed to fetch rooms");
    }
  };

  // Fetch users with roles and departments
  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      // Fetch users with a simpler query
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('last_name');

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }

      console.log('Fetched users:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      toast.error("Failed to fetch users");
    }
  };

  // Handle reservation status update
  const handleReservationStatus = async (id: number, status: number, approvedBy: number) => {
    try {
      const { error } = await supabase
        .from("reservation")
        .update({ 
          room_status: status,
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq("reservation_id", id)

      if (error) throw error
      toast.success("Reservation status updated")
      fetchReservations()
    } catch (error) {
      console.error("Error updating reservation:", error)
      toast.error("Failed to update reservation status")
    }
  }

  // Handle inventory item addition
  const handleAddItem = async () => {
    try {
      const { error } = await supabase
        .from("inventoryitem")
        .insert([{
          ...newItem,
          quantity: parseInt(newItem.quantity),
          purchase_date: new Date().toISOString()
        }])

      if (error) throw error
      toast.success("Item added successfully")
      setNewItem({
        item_name: "",
        quantity: "",
        condition_id: "",
        category_id: "",
        purchase_date: ""
      })
      fetchInventory()
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error("Failed to add item")
    }
  }

  // Handle room addition
  const handleAddRoom = async () => {
    try {
      const { error } = await supabase
        .from("room")
        .insert([{
          ...newRoom,
          room_capacity: parseInt(newRoom.room_capacity)
        }])

      if (error) throw error
      toast.success("Room added successfully")
      setNewRoom({
        room_number: "",
        room_capacity: "",
        room_status: "",
        is_available: true
      })
      fetchRooms()
    } catch (error) {
      console.error("Error adding room:", error)
      toast.error("Failed to add room")
    }
  }

  // Handle user addition
  const handleAddUser = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .insert([{
          ...newUser,
          is_active: true,
          last_login: new Date().toISOString()
        }])

      if (error) throw error
      toast.success("User added successfully")
      setNewUser({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        contact_number: "",
        user_role: "",
        department: "",
        password: ""
      })
      fetchUsers()
    } catch (error) {
      console.error("Error adding user:", error)
      toast.error("Failed to add user")
    }
  }

  // Handle item deletion
  const handleDeleteItem = async (id: number) => {
    try {
      const { error } = await supabase
        .from("inventoryitem")
        .delete()
        .eq("item_id", id)

      if (error) throw error
      toast.success("Item deleted successfully")
      fetchInventory()
    } catch (error) {
      console.error("Error deleting item:", error)
      toast.error("Failed to delete item")
    }
  }

  // Handle room deletion
  const handleDeleteRoom = async (id: number) => {
    try {
      const { error } = await supabase
        .from("room")
        .delete()
        .eq("room_id", id)

      if (error) throw error
      toast.success("Room deleted successfully")
      fetchRooms()
    } catch (error) {
      console.error("Error deleting room:", error)
      toast.error("Failed to delete room")
    }
  }

  // Handle user deletion
  const handleDeleteUser = async (id: number) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("user_id", id)

      if (error) throw error
      toast.success("User deactivated successfully")
      fetchUsers()
    } catch (error) {
      console.error("Error deactivating user:", error)
      toast.error("Failed to deactivate user")
    }
  }

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([
        fetchStats(),
        fetchReservations(),
        fetchInventory(),
        fetchRooms(),
        fetchUsers()
      ])
      setLoading(false)
    }
    fetchData()
  }, [])

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
          <div className="text-3xl font-bold text-blue-700">{stats.activeReservations}</div>
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
          <div className="text-3xl font-bold text-yellow-700">{stats.pendingRequests}</div>
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
          <div className="text-3xl font-bold text-green-700">{stats.lowStockItems}</div>
          <p className="text-green-600 text-sm">Items with low stock</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system activities and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reservations.slice(0, 3).map((reservation: any) => (
              <div key={reservation.reservation_id} className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {reservation.users?.first_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {`${reservation.users?.first_name} ${reservation.users?.last_name}`} made a reservation
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(reservation.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline">
                  {reservation.room_status === 1 ? "Active" : "Pending"}
                </Badge>
              </div>
            ))}
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
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Search reservations..." 
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservations
                .filter((res: any) => 
                  res.reservation_id.toString().includes(searchQuery) ||
                  `${res.users?.first_name} ${res.users?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  res.room?.room_number.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((reservation: any) => (
                  <TableRow key={reservation.reservation_id}>
                    <TableCell>REQ-{reservation.reservation_id}</TableCell>
                    <TableCell>
                      {`${reservation.users?.first_name} ${reservation.users?.last_name}`}
                    </TableCell>
                    <TableCell>{reservation.room?.room_number}</TableCell>
                    <TableCell>{new Date(reservation.reservation_date).toLocaleDateString()}</TableCell>
                    <TableCell>{`${reservation.start_time} - ${reservation.end_time}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        reservation.room_status === 1 ? "bg-green-50 text-green-700 border-green-200" :
                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }>
                        {reservation.room_status === 1 ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">View</Button>
                        {!reservation.approved_by && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-green-600"
                              onClick={() => handleReservationStatus(reservation.reservation_id, 1, 1)} // Assuming 1 is admin ID
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600"
                              onClick={() => handleReservationStatus(reservation.reservation_id, 2, 1)} // Assuming 2 is rejected status
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
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
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>Add a new item to the inventory</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item_name">Name</Label>
                  <Input
                    id="item_name"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={newItem.condition_id}
                    onValueChange={(value) => setNewItem({ ...newItem, condition_id: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newItem.category_id}
                    onValueChange={(value) => setNewItem({ ...newItem, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Equipment</SelectItem>
                      <SelectItem value="2">Supplies</SelectItem>
                      <SelectItem value="3">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddItem} className="w-full">Add Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Search inventory..." 
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory
                .filter((item: any) => 
                  item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.inventorycategory?.category_name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item: any) => (
                  <TableRow key={item.item_id}>
                    <TableCell>INV-{item.item_id}</TableCell>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>{item.inventorycategory?.category_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.itemcondition?.condition_name}</TableCell>
                    <TableCell>
                      <Badge variant={item.quantity <= 5 ? "destructive" : "outline"}>
                        {item.quantity <= 5 ? "Low Stock" : "In Stock"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600"
                          onClick={() => handleDeleteItem(item.item_id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  // Rooms management
  const RoomsManagement = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Rooms Management</CardTitle>
          <CardDescription>Manage laboratory rooms and facilities</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>Add a new room to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="room_number">Room Number</Label>
                  <Input
                    id="room_number"
                    value={newRoom.room_number}
                    onChange={(e) => setNewRoom({ ...newRoom, room_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="room_capacity">Capacity</Label>
                  <Input
                    id="room_capacity"
                    type="number"
                    value={newRoom.room_capacity}
                    onChange={(e) => setNewRoom({ ...newRoom, room_capacity: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="room_status">Status</Label>
                  <Select
                    value={newRoom.room_status}
                    onValueChange={(value) => setNewRoom({ ...newRoom, room_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Available</SelectItem>
                      <SelectItem value="2">Maintenance</SelectItem>
                      <SelectItem value="3">Occupied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddRoom} className="w-full">Add Room</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Search rooms..." 
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room ID</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms
                .filter((room: any) => 
                  room.room_number.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((room: any) => (
                  <TableRow key={room.room_id}>
                    <TableCell>RM-{room.room_id}</TableCell>
                    <TableCell>{room.room_number}</TableCell>
                    <TableCell>{room.room_capacity}</TableCell>
                    <TableCell>{room.roomstatus?.status_name}</TableCell>
                    <TableCell>
                      <Badge variant={room.is_available ? "outline" : "destructive"}>
                        {room.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Schedule</Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600"
                          onClick={() => handleDeleteRoom(room.room_id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  // Users management
  const UsersManagement = () => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Users Management</CardTitle>
          <CardDescription>Manage system users and permissions</CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>Add a new user to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input
                    id="middle_name"
                    value={newUser.middle_name}
                    onChange={(e) => setNewUser({ ...newUser, middle_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_number">Contact Number</Label>
                  <Input
                    id="contact_number"
                    value={newUser.contact_number}
                    onChange={(e) => setNewUser({ ...newUser, contact_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="user_role">Role</Label>
                  <Select
                    value={newUser.user_role}
                    onValueChange={(value) => setNewUser({ ...newUser, user_role: value })}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newUser.department}
                    onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">CCIS</SelectItem>
                      <SelectItem value="2">CET</SelectItem>
                      <SelectItem value="3">CAS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddUser} className="w-full">Add User</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Input 
              placeholder="Search users..." 
              className="max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users
                .filter((user: any) => 
                  `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  user.userrole?.role_name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((user: any) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarFallback>
                            {user.first_name?.[0]}{user.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{`${user.first_name} ${user.last_name}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {user.userrole?.role_name}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department_info?.department_name}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "outline" : "destructive"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.last_login).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="outline">Permissions</Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600"
                          onClick={() => handleDeleteUser(user.user_id)}
                        >
                          Deactivate
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage reservations, requests, and inventory</p>
          </div>

          <div className="space-y-6">
            {currentTab === "dashboard" && <DashboardOverview />}
            {currentTab === "requests" && <ReservationRequests />}
            {currentTab === "inventory" && <InventoryManagement />}
            {currentTab === "rooms" && <RoomsManagement />}
            {currentTab === "users" && <UsersManagement />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block border-l bg-gray-50 p-4">
          <ReservationSidebar userRole="admin" />
        </div>
      </div>
    </DashboardLayout>
  )
}
