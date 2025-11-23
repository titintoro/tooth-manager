'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Calendar } from 'lucide-react'
import { findWaitlistCandidates, convertWaitlistToAppointment } from '@/app/(app)/lista-espera/actions'
import { useRouter } from 'next/navigation'
import { WaitlistUrgency } from '@prisma/client'

interface WaitlistCandidatesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  slotData: {
    date: Date
    start: string // ISO string
    duration: number
    treatmentTypeId?: string
    chairId?: string
    staffMemberId?: string
  }
}

const URGENCY_LABELS: Record<WaitlistUrgency, { label: string; color: string }> = {
  LOW: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  NORMAL: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  HIGH: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
}

export function WaitlistCandidatesDialog({
  open,
  onOpenChange,
  slotData,
}: WaitlistCandidatesDialogProps) {
  const router = useRouter()
  const [candidates, setCandidates] = useState<Array<{
    id: string
    urgency: WaitlistUrgency
    preferredTimeSlot: string | null
    notes: string | null
    patient: {
      firstName: string
      lastName: string
      phone: string | null
      email: string | null
    }
    treatmentType: {
      name: string
      color: string | null
      defaultDuration: number
    } | null
  }>>([])
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)

  const loadCandidates = useCallback(async () => {
    setLoading(true)
    try {
      // Determinar el timeSlot basado en la hora
      const hour = new Date(slotData.start).getHours()
      let timeSlot: 'MORNING' | 'AFTERNOON' | 'EVENING' | undefined
      
      if (hour >= 6 && hour < 12) {
        timeSlot = 'MORNING'
      } else if (hour >= 12 && hour < 18) {
        timeSlot = 'AFTERNOON'
      } else {
        timeSlot = 'EVENING'
      }

      const data = await findWaitlistCandidates({
        treatmentTypeId: slotData.treatmentTypeId,
        date: slotData.date,
        duration: slotData.duration,
        timeSlot,
      })

      setCandidates(data)
    } catch (error) {
      console.error('Error loading candidates:', error)
    }
    setLoading(false)
  }, [slotData])

  useEffect(() => {
    if (open) {
      loadCandidates()
    }
  }, [open, loadCandidates])

  const handleAssignSlot = async (candidateId: string) => {
    if (!confirm('¿Asignar este horario al paciente?')) return

    setConverting(candidateId)
    try {
      await convertWaitlistToAppointment(candidateId, {
        start: slotData.start,
        duration: slotData.duration,
        chairId: slotData.chairId,
        staffMemberId: slotData.staffMemberId,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al asignar el horario')
    }
    setConverting(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Candidatos de Lista de Espera</DialogTitle>
          <DialogDescription>
            Pacientes disponibles para este horario
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-gray-500">Buscando candidatos...</p>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No hay candidatos disponibles para este horario</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className="p-4 border rounded-lg hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">
                          {candidate.patient.firstName} {candidate.patient.lastName}
                        </p>
                        <Badge className={URGENCY_LABELS[candidate.urgency].color}>
                          {URGENCY_LABELS[candidate.urgency].label}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600">
                        {candidate.patient.phone && (
                          <p>📞 {candidate.patient.phone}</p>
                        )}
                        {candidate.patient.email && (
                          <p>✉️ {candidate.patient.email}</p>
                        )}
                        {candidate.treatmentType && (
                          <p className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: candidate.treatmentType.color || '#3b82f6' }}
                            />
                            {candidate.treatmentType.name}
                            {candidate.treatmentType.defaultDuration && (
                              <span className="text-gray-500">
                                ({candidate.treatmentType.defaultDuration} min)
                              </span>
                            )}
                          </p>
                        )}
                        {candidate.preferredTimeSlot && (
                          <p>⏰ Preferencia: {candidate.preferredTimeSlot}</p>
                        )}
                        {candidate.notes && (
                          <p className="italic text-gray-500 mt-2">{candidate.notes}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleAssignSlot(candidate.id)}
                      disabled={converting !== null}
                    >
                      {converting === candidate.id ? (
                        'Asignando...'
                      ) : (
                        <>
                          <Calendar className="mr-2 h-4 w-4" />
                          Asignar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
