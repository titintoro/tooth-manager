'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Calendar, Bell, X } from 'lucide-react'
import { updateWaitlistStatus, deleteWaitlistEntry } from './actions'
import { useRouter } from 'next/navigation'
import { WaitlistStatus, WaitlistUrgency } from '@prisma/client'

interface WaitlistEntry {
  id: string
  urgency: WaitlistUrgency
  preferredTimeSlot: string | null
  notes: string | null
  status: WaitlistStatus
  createdAt: Date
  patient: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  }
  treatmentType: {
    id: string
    name: string
    color: string | null
    defaultDuration: number
  } | null
}

const URGENCY_LABELS: Record<WaitlistUrgency, { label: string; color: string }> = {
  LOW: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
}

const TIME_SLOT_LABELS: Record<string, string> = {
  MORNING: 'Mañana',
  AFTERNOON: 'Tarde',
  EVENING: 'Noche',
}

export function WaitlistTable({ entries }: { entries: WaitlistEntry[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleNotify = async (id: string) => {
    if (!confirm('¿Notificar al paciente sobre disponibilidad?')) return
    
    setLoading(id)
    try {
      await updateWaitlistStatus(id, WaitlistStatus.NOTIFIED)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al notificar al paciente')
    }
    setLoading(null)
  }

  const handleSchedule = async (id: string) => {
    // Redirigir a la agenda con el paciente seleccionado
    router.push(`/agenda?waitlistId=${id}`)
  }

  const handleCancel = async (id: string) => {
    if (!confirm('¿Cancelar esta entrada de lista de espera?')) return
    
    setLoading(id)
    try {
      await updateWaitlistStatus(id, WaitlistStatus.CANCELLED)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cancelar')
    }
    setLoading(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente esta entrada?')) return
    
    setLoading(id)
    try {
      await deleteWaitlistEntry(id)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar')
    }
    setLoading(null)
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-12 text-center">
        <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay pacientes en espera</h3>
        <p className="text-gray-600">
          Los pacientes aparecerán aquí cuando soliciten entrar en la lista de espera
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Paciente</TableHead>
            <TableHead>Tratamiento</TableHead>
            <TableHead>Urgencia</TableHead>
            <TableHead>Preferencia</TableHead>
            <TableHead>Fecha Solicitud</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>
                <div>
                  <p className="font-medium">
                    {entry.patient.firstName} {entry.patient.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {entry.patient.phone || entry.patient.email || '-'}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                {entry.treatmentType ? (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.treatmentType.color || '#3b82f6' }}
                    />
                    <span>{entry.treatmentType.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">Cualquier tratamiento</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={URGENCY_LABELS[entry.urgency].color}>
                  {URGENCY_LABELS[entry.urgency].label}
                </Badge>
              </TableCell>
              <TableCell>
                {entry.preferredTimeSlot ? (
                  <span className="text-sm">
                    {TIME_SLOT_LABELS[entry.preferredTimeSlot] || entry.preferredTimeSlot}
                  </span>
                ) : (
                  <span className="text-gray-500 text-sm">Sin preferencia</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {format(new Date(entry.createdAt), "d 'de' MMM, yyyy", { locale: es })}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading === entry.id}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSchedule(entry.id)}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Agendar cita
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNotify(entry.id)}>
                      <Bell className="mr-2 h-4 w-4" />
                      Notificar disponibilidad
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCancel(entry.id)}>
                      <X className="mr-2 h-4 w-4" />
                      Marcar como cancelado
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-600"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
