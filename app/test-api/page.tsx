'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function TestAPI() {
  const [rooms, setRooms] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRooms() {
      try {
        const { data, error } = await supabase
          .from('room')
          .select('*')
        
        if (error) {
          throw error
        }
        
        setRooms(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchRooms()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase API Test</h1>
      
      {loading && <p>Loading...</p>}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {!loading && !error && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Rooms from Database:</h2>
          {rooms.length === 0 ? (
            <p>No rooms found in the database.</p>
          ) : (
            <ul className="space-y-2">
              {rooms.map((room) => (
                <li key={room.roomid} className="bg-white p-4 rounded shadow">
                  <p className="font-medium">Room {room.roomnumber}</p>
                  <p>Capacity: {room.roomcapacity}</p>
                  <p>Type: {room.roomtype}</p>
                  <p>Status: {room.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
} 