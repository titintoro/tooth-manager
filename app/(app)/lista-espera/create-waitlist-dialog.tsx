'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { createWaitlistEntry } from './actions'
import { useRouter } from 'next/navigation'
import { WaitlistUrgency } from '@prisma/client'

// Import para obtener pacientes
import { getPatients } from '../pacientes/actions'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export function CreateWaitlistDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  
  const [formData, setFormData] = useState({
    patientId: '',
    treatmentTypeId: '',
    preferredTimeSlot: 'NONE',
    urgency: 'NORMAL' as WaitlistUrgency,
    notes: '',
  })

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    try {
      const patientsData = await getPatients()
      setPatients(patientsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.patientId) {
      alert('Selecciona un paciente')
      return
    }

    setLoading(true)
    try {
      await createWaitlistEntry({
        patientId: formData.patientId,
        treatmentTypeId: formData.treatmentTypeId || undefined,
        preferredTimeSlot: formData.preferredTimeSlot && formData.preferredTimeSlot !== 'NONE' ? formData.preferredTimeSlot : undefined,
        urgency: formData.urgency,
        notes: formData.notes || undefined,
      })

      setOpen(false)
      setFormData({
        patientId: '',
        treatmentTypeId: '',
        preferredTimeSlot: 'NONE',
        urgency: 'NORMAL',
        notes: '',
      })
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al crear la entrada')
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Añadir a Lista de Espera
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Añadir Paciente a Lista de Espera</DialogTitle>
          <DialogDescription>
            El paciente será notificado cuando haya disponibilidad
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente *</Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => setFormData({ ...formData, patientId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un paciente" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeSlot">Preferencia de horario</Label>
            <Select
              value={formData.preferredTimeSlot}
              onValueChange={(value) => setFormData({ ...formData, preferredTimeSlot: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin preferencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Sin preferencia</SelectItem>
                <SelectItem value="MORNING">Mañana</SelectItem>
                <SelectItem value="AFTERNOON">Tarde</SelectItem>
                <SelectItem value="EVENING">Noche</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency">Urgencia</Label>
            <Select
              value={formData.urgency}
              onValueChange={(value) => setFormData({ ...formData, urgency: value as WaitlistUrgency })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">Baja</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">Alta</SelectItem>
                <SelectItem value="URGENT">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Información adicional..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Añadir a Lista'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
