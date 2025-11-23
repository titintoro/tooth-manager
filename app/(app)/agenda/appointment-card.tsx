'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Clock, User, Stethoscope } from 'lucide-react'
import { AppointmentDetailsDialog } from './appointment-details-dialog'

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

interface AppointmentCardProps {
  appointment: Appointment
}

const STATUS_COLORS = {
  SCHEDULED: 'bg-blue-100 border-blue-300 text-blue-900',
  CONFIRMED: 'bg-green-100 border-green-300 text-green-900',
  COMPLETED: 'bg-gray-100 border-gray-300 text-gray-700',
  CANCELLED: 'bg-red-100 border-red-300 text-red-700',
  NO_SHOW: 'bg-orange-100 border-orange-300 text-orange-900',
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const statusColor =
    STATUS_COLORS[appointment.status as keyof typeof STATUS_COLORS] ||
    STATUS_COLORS.SCHEDULED

  const backgroundColor = appointment.treatmentType?.color || '#3b82f6'

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('appointmentId', appointment.id)
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={cn(
          'h-full px-2 py-1 border-l-4 rounded text-xs overflow-hidden cursor-move hover:shadow-md transition-shadow',
          statusColor,
          isDragging && 'opacity-50'
        )}
        style={{ borderLeftColor: backgroundColor }}
        onClick={() => {
          // Prevent opening details when starting drag
          if (!isDragging) {
            setDetailsOpen(true)
          }
        }}
      >
        <div className="font-semibold truncate">
          {appointment.patient.firstName} {appointment.patient.lastName}
        </div>
        {appointment.treatmentType && (
          <div className="flex items-center gap-1 text-[10px] truncate mt-0.5">
            <Stethoscope className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{appointment.treatmentType.name}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-[10px] mt-0.5">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>
            {format(new Date(appointment.start), 'HH:mm')} -{' '}
            {format(new Date(appointment.end), 'HH:mm')}
          </span>
        </div>
        {appointment.staffMember && (
          <div className="flex items-center gap-1 text-[10px] truncate mt-0.5">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">
              {appointment.staffMember.firstName} {appointment.staffMember.lastName}
            </span>
          </div>
        )}
      </div>

      {detailsOpen && (
        <AppointmentDetailsDialog
          appointmentId={appointment.id}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </>
  )
}
