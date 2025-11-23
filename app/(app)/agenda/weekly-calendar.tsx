'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarGrid } from './calendar-grid'
import { CreateAppointmentDialog } from './create-appointment-dialog'
import { updateAppointment } from './actions'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'

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
    defaultDuration: number
  } | null
  staffMember: {
    id: string
    firstName: string
    lastName: string
    color: string | null
  } | null
  chair: {
    id: string
    name: string
  } | null
}

interface Chair {
  id: string
  name: string
  location: string | null
  isActive: boolean
  displayOrder: number
}

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  profession: string | null
  color: string | null
  isActive: boolean
  canBookAppointments: boolean
}

interface WeeklyCalendarProps {
  appointments: Appointment[]
  chairs: Chair[]
  staffMembers: StaffMember[]
  currentDate: Date
  viewMode: 'chair' | 'staff'
}

export function WeeklyCalendar({
  appointments,
  chairs,
  staffMembers,
  currentDate,
  viewMode,
}: WeeklyCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date
    resourceId: string
  } | null>(null)

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1)
    const params = new URLSearchParams(searchParams)
    params.set('date', newDate.toISOString())
    router.push(`/agenda?${params.toString()}`)
  }

  const goToToday = () => {
    const params = new URLSearchParams(searchParams)
    params.set('date', new Date().toISOString())
    router.push(`/agenda?${params.toString()}`)
  }

  const changeView = (value: string) => {
    if (value === 'chair' || value === 'staff') {
      const params = new URLSearchParams(searchParams)
      params.set('view', value)
      router.push(`/agenda?${params.toString()}`)
    }
  }

  const handleSlotClick = (date: Date, resourceId: string) => {
    setSelectedSlot({ date, resourceId })
    setCreateDialogOpen(true)
  }

  const handleAppointmentDrop = async (appointmentId: string, newStart: Date, newResourceId: string) => {
    try {
      // Find the appointment to get the original duration
      const appointment = appointments.find(apt => apt.id === appointmentId)
      if (!appointment) return

      const duration = Math.floor((appointment.end.getTime() - appointment.start.getTime()) / (1000 * 60))

      await updateAppointment(appointmentId, {
        start: newStart.toISOString(),
        duration: duration,
        chairId: viewMode === 'chair' ? newResourceId : (appointment.chair?.id || undefined),
        staffMemberId: viewMode === 'staff' ? newResourceId : (appointment.staffMember?.id || undefined),
      })

      router.refresh()
    } catch (error) {
      console.error('Error moving appointment:', error)
      alert(error instanceof Error ? error.message : 'Error al mover la cita')
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Agenda</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Hoy
            </Button>
            <Button variant="outline" size="icon" onClick={() => navigateWeek('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-lg font-medium">
            {format(weekStart, "d 'de' MMMM", { locale: es })} -{' '}
            {format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ToggleGroup type="single" value={viewMode} onValueChange={changeView}>
            <ToggleGroupItem value="chair">Por Sillón</ToggleGroupItem>
            <ToggleGroupItem value="staff">Por Profesional</ToggleGroupItem>
          </ToggleGroup>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva cita
          </Button>
        </div>
      </div>

      <CalendarGrid
        appointments={appointments}
        chairs={chairs}
        staffMembers={staffMembers}
        weekDays={weekDays}
        viewMode={viewMode}
        onSlotClick={handleSlotClick}
        onAppointmentDrop={handleAppointmentDrop}
      />

      {createDialogOpen && (
        <CreateAppointmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          chairs={chairs}
          staffMembers={staffMembers}
          initialSlot={selectedSlot}
        />
      )}
    </div>
  )
}
