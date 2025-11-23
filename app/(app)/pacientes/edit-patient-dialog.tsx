'use client'

import { useState } from 'react'
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
import { updatePatient } from './actions'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  dateOfBirth?: Date | null
  address?: string | null
  city?: string | null
  notes?: string | null
  isActive: boolean
}

interface EditPatientDialogProps {
  patient: Patient
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPatientDialog({ patient, open, onOpenChange }: EditPatientDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(patient.isActive)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      await updatePatient(patient.id, {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
        dateOfBirth: formData.get('dateOfBirth') as string || undefined,
        address: formData.get('address') as string || undefined,
        city: formData.get('city') as string || undefined,
        notes: formData.get('notes') as string || undefined,
        isActive,
      })

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar paciente</DialogTitle>
            <DialogDescription>
              Actualiza la información del paciente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  required
                  minLength={2}
                  disabled={loading}
                  defaultValue={patient.firstName}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  required
                  minLength={2}
                  disabled={loading}
                  defaultValue={patient.lastName}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  disabled={loading}
                  defaultValue={patient.email || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  disabled={loading}
                  defaultValue={patient.phone || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Fecha de nacimiento</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                disabled={loading}
                defaultValue={
                  patient.dateOfBirth
                    ? format(new Date(patient.dateOfBirth), 'yyyy-MM-dd')
                    : ''
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  name="address"
                  disabled={loading}
                  defaultValue={patient.address || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  name="city"
                  disabled={loading}
                  defaultValue={patient.city || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas administrativas</Label>
              <Textarea
                id="notes"
                name="notes"
                disabled={loading}
                defaultValue={patient.notes || ''}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsActive(true)}
                  disabled={loading}
                >
                  Activo
                </Button>
                <Button
                  type="button"
                  variant={!isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsActive(false)}
                  disabled={loading}
                >
                  Inactivo
                </Button>
              </div>
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
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
