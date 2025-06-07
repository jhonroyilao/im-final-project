export interface User {
  id: string
  email: string
  role: "student" | "faculty" | "admin"
  created_at: string
}

export interface Student {
  id: string
  user_id: string
  student_number: string
  first_name: string
  middle_name?: string
  surname: string
}

export interface Faculty {
  id: string
  user_id: string
  faculty_number: string
  first_name: string
  middle_name?: string
  surname: string
}

export interface Room {
  roomid: number
  roomnumber: string
  roomcapacity: number
  roomtype: string
  status: string
}

export interface InventoryItem {
  id: string
  name: string
  description?: string
  total_quantity: number
  available_quantity: number
  category?: string
}

export interface Reservation {
  id: string
  user_id: string
  room_id: string
  reservation_date: string
  time_start: string
  time_end: string
  number_of_students: number
  reason: string
  status: "pending" | "approved" | "rejected" | "cancelled"
  file_url?: string
  created_at: string
} 