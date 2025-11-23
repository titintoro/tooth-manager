'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { AppointmentCard } from './appointment-card'
import { cn } from '@/lib/utils'

interface Appointment {
  id: string
  start: Date
  end: Date
  status: string
  notes: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
  }
  treatmentType: {
    id: string
    name: string
    color: string | null
  } | null
  staffMember: {
    id: string
    firstName: string
    lastName: string
  } | null
  chair: {
    id: string
    name: string
  } | null
}

interface CalendarGridProps {
  appointments: Appointment[]
  chairs: Array<{ id: string; name: string; location: string | null; isActive: boolean; displayOrder: number }>
  staffMembers: Array<{ id: string; firstName: string; lastName: string; profession: string | null; color: string | null; isActive: boolean; canBookAppointments: boolean }>
  weekDays: Date[]
  viewMode: 'chair' | 'staff'
  onSlotClick: (date: Date, resourceId: string) => void
  onAppointmentDrop: (appointmentId: string, newStart: Date, newResourceId: string) => void
}

type CombinedResource = 
  | { id: string; name: string; location: string | null; isActive: boolean; displayOrder: number }
  | { id: string; firstName: string; lastName: string; profession: string | null; color: string | null; isActive: boolean; canBookAppointments: boolean }

const TIME_SLOTS = Array.from({ length: 56 }, (_, i) => {
  const hour = Math.floor(i / 4) + 8 // Start at 8:00
  const minute = (i % 4) * 15
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
})

export function CalendarGrid({
  appointments,
  chairs,
  staffMembers,
  weekDays,
  viewMode,
  onSlotClick,
  onAppointmentDrop,
}: CalendarGridProps) {
  const resources: CombinedResource[] = viewMode === 'chair' ? chairs : staffMembers
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent, date: Date, resourceId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverSlot(`${date.toISOString()}-${resourceId}`)
  }

  const handleDragLeave = () => {
    setDragOverSlot(null)
  }

  const handleDrop = (e: React.DragEvent, date: Date, slot: string, resourceId: string) => {
    e.preventDefault()
    setDragOverSlot(null)

    const appointmentId = e.dataTransfer.getData('appointmentId')
    
    // Calculate new start time based on the slot
    const [hours, minutes] = slot.split(':').map(Number)
    const newStart = new Date(date)
    newStart.setHours(hours, minutes, 0, 0)

    onAppointmentDrop(appointmentId, newStart, resourceId)
  }

  const getAppointmentsForSlot = (date: Date, resourceId: string, timeSlot: string) => {
    const [hour, minute] = timeSlot.split(':').map(Number)
    const slotStart = new Date(date)
    slotStart.setHours(hour, minute, 0, 0)
    const slotEnd = new Date(slotStart.getTime() + 15 * 60000)

    return appointments.filter((apt) => {
      const aptStart = new Date(apt.start)
      const aptEnd = new Date(apt.end)

      const resourceMatches =
        viewMode === 'chair'
          ? apt.chair?.id === resourceId
          : apt.staffMember?.id === resourceId

      const timeOverlaps =
        (aptStart < slotEnd && aptEnd > slotStart) ||
        (aptStart >= slotStart && aptStart < slotEnd)

      return resourceMatches && timeOverlaps && apt.status !== 'CANCELLED'
    })
  }

  const calculateAppointmentPosition = (appointment: Appointment, slotStart: Date) => {
    const aptStart = new Date(appointment.start)
    const aptEnd = new Date(appointment.end)

    // Calculate offset from slot start in minutes
    const offsetMinutes = Math.max(0, (aptStart.getTime() - slotStart.getTime()) / 60000)
    const durationMinutes = (aptEnd.getTime() - aptStart.getTime()) / 60000

    // Each slot is 15 minutes, height is calculated based on that
    const topPercent = (offsetMinutes / 15) * 100
    const heightPercent = (durationMinutes / 15) * 100

    return { topPercent, heightPercent }
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <p className="text-lg font-medium mb-2">
          No hay {viewMode === 'chair' ? 'sillones' : 'profesionales'} activos
        </p>
        <p className="text-sm text-muted-foreground">
          Agrega {viewMode === 'chair' ? 'sillones' : 'profesionales'} en la configuración
          para poder gestionar citas
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg bg-background overflow-auto">
      <div className="min-w-[1200px]">
        {/* Header */}
        <div className="grid sticky top-0 z-10 bg-background border-b" style={{ gridTemplateColumns: `80px repeat(${resources.length}, 1fr)` }}>
          <div className="border-r p-2 font-medium text-sm bg-muted"></div>
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="border-r last:border-r-0 p-3 font-medium text-center bg-muted"
            >
              {'name' in resource
                ? resource.name
                : `${resource.firstName} ${resource.lastName}`}
            </div>
          ))}
        </div>

        {/* Days */}
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="border-b last:border-b-0">
            <div
              className="grid bg-muted/50"
              style={{ gridTemplateColumns: `80px repeat(${resources.length}, 1fr)` }}
            >
              <div className="border-r p-2 font-medium text-sm">
                {format(day, 'EEE d', { locale: es })}
              </div>
              {resources.map((resource) => (
                <div key={resource.id} className="border-r last:border-r-0"></div>
              ))}
            </div>

            {/* Time slots */}
            {TIME_SLOTS.map((timeSlot, index) => {
              const [hour, minute] = timeSlot.split(':').map(Number)
              const slotDate = new Date(day)
              slotDate.setHours(hour, minute, 0, 0)

              return (
                <div
                  key={timeSlot}
                  className="grid"
                  style={{ gridTemplateColumns: `80px repeat(${resources.length}, 1fr)` }}
                >
                  <div
                    className={cn(
                      'border-r p-1 text-xs text-muted-foreground',
                      index % 4 === 0 ? 'border-t' : 'border-t border-dashed'
                    )}
                  >
                    {index % 4 === 0 && timeSlot}
                  </div>
                  {resources.map((resource) => {
                    const slotAppointments = getAppointmentsForSlot(day, resource.id, timeSlot)
                    const slotKey = `${slotDate.toISOString()}-${resource.id}`
                    const isDropTarget = dragOverSlot === slotKey

                    return (
                      <div
                        key={resource.id}
                        className={cn(
                          'border-r last:border-r-0 relative min-h-[20px] hover:bg-muted/50 cursor-pointer transition-colors',
                          index % 4 === 0 ? 'border-t' : 'border-t border-dashed',
                          isDropTarget && 'bg-blue-100'
                        )}
                        onClick={() => onSlotClick(slotDate, resource.id)}
                        onDragOver={(e) => handleDragOver(e, day, resource.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day, timeSlot, resource.id)}
                      >
                        {slotAppointments.length > 0 &&
                          index % 4 === 0 &&
                          slotAppointments.map((apt) => {
                            const position = calculateAppointmentPosition(apt, slotDate)
                            return (
                              <div
                                key={apt.id}
                                className="absolute left-0 right-0 z-[1]"
                                style={{
                                  top: `${position.topPercent}%`,
                                  height: `${position.heightPercent}%`,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <AppointmentCard appointment={apt} />
                              </div>
                            )
                          })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
