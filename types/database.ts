export interface User {
  userid: number
  name: string
  email: string
  contactnumber: string
  password: string
  role: "student" | "faculty" | "admin"
  department: string
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
  itemid: number
  roomid: number
  itemname: string
  quantity: number
  condition: string
}

export interface InventoryLog {
  logid: number
  itemid: number
  changedate: string
  statusupdate: string
  remarks: string
}

export interface Reservation {
  reservationid: number
  userid: number
  roomid: number
  reservationdate: string
  starttime: string
  endtime: string
  status: string
  prioritylevel: string
}

// Additional interfaces for recommended Supabase additions
export interface ScheduledClass {
  id: number
  roomid: number
  class_name: string
  instructor_name: string
  day_of_week: number
  time_start: string
  time_end: string
  semester: string
  academic_year: string
}

export interface Notification {
  id: number
  userid: number
  title: string
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface RoomEquipment {
  id: number
  roomid: number
  itemid: number
  quantity: number
}

export interface ReservationEquipment {
  id: number
  reservationid: number
  itemid: number
  quantity: number
} 