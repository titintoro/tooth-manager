'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createAppointment, getAppointmentFormData } from './actions'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Chair {
  id: string
  name: string
}

interface StaffMember {
  id: string
  firstName: string
  lastName: string
}

interface CreateAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chairs: Chair[]
  staffMembers: StaffMember[]
  initialSlot?: {
    date: Date
    resourceId: string
  } | null
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  chairs,
  staffMembers,
  initialSlot,
}: CreateAppointmentDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<{
    patients: Array<{ id: string; firstName: string; lastName: string; phone: string | null }>
    treatmentTypes: Array<{ id: string; name: string; defaultDuration: number; color: string | null }>
  } | null>(null)
  const [selectedTreatment, setSelectedTreatment] = useState<string>('')
  const [duration, setDuration] = useState<number>(30)

  useEffect(() => {
    if (open) {
      getAppointmentFormData().then(setFormData)
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = new FormData(e.currentTarget)

    try {
      await createAppointment({
        patientId: form.get('patientId') as string,
        treatmentTypeId: selectedTreatment || undefined,
        staffMemberId: form.get('staffMemberId') as string || undefined,
        chairId: form.get('chairId') as string || undefined,
        start: form.get('start') as string,
        duration: parseInt(form.get('duration') as string),
        notes: form.get('notes') as string || undefined,
      })

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la cita')
    } finally {
      setLoading(false)
    }
  }

  const handleTreatmentChange = (value: string) => {
    setSelectedTreatment(value)
    const treatment = formData?.treatmentTypes.find((t) => t.id === value)
    if (treatment) {
      setDuration(treatment.defaultDuration)
    }
  }

  if (!formData) {
    return null
  }

  const defaultDate = initialSlot
    ? format(initialSlot.date, "yyyy-MM-dd'T'HH:mm")
    : format(new Date(), "yyyy-MM-dd'T'09:00")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nueva cita</DialogTitle>
            <DialogDescription>
              Programa una nueva cita para un paciente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="patientId">Paciente *</Label>
              <Select name="patientId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {formData.patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.firstName} {patient.lastName}
                      {patient.phone && ` • ${patient.phone}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Fecha y hora *</Label>
                <Input
                  id="start"
                  name="start"
                  type="datetime-local"
                  required
                  disabled={loading}
                  defaultValue={defaultDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  required
                  min="5"
                  step="5"
                  disabled={loading}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="treatmentTypeId">Tipo de tratamiento</Label>
              <Select
                name="treatmentTypeId"
                value={selectedTreatment}
                onValueChange={handleTreatmentChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tratamiento" />
                </SelectTrigger>
                <SelectContent>
                  {formData.treatmentTypes.map((treatment) => (
                    <SelectItem key={treatment.id} value={treatment.id}>
                      <div className="flex items-center gap-2">
                        {treatment.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: treatment.color }}
                          />
                        )}
                        {treatment.name} ({treatment.defaultDuration} min)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="staffMemberId">Profesional</Label>
                <Select name="staffMemberId" defaultValue={initialSlot?.resourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un profesional" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.firstName} {staff.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="chairId">Sillón</Label>
                <Select name="chairId" defaultValue={initialSlot?.resourceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un sillón" />
                  </SelectTrigger>
                  <SelectContent>
                    {chairs.map((chair) => (
                      <SelectItem key={chair.id} value={chair.id}>
                        {chair.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                disabled={loading}
                placeholder="Notas sobre la cita..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear cita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
