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
import { updateStaffMember } from './actions'
import { useRouter } from 'next/navigation'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  profession: string | null
  email: string | null
  phone: string | null
  isActive: boolean
}

interface EditStaffDialogProps {
  staff: StaffMember
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditStaffDialog({ staff, open, onOpenChange }: EditStaffDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(staff.isActive)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    try {
      await updateStaffMember(staff.id, {
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        profession: formData.get('profession') as string,
        email: formData.get('email') as string || undefined,
        phone: formData.get('phone') as string || undefined,
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
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar miembro del personal</DialogTitle>
            <DialogDescription>
              Actualiza la información del miembro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre *</Label>
              <Input
                id="firstName"
                name="firstName"
                required
                minLength={2}
                disabled={loading}
                defaultValue={staff.firstName}
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
                defaultValue={staff.lastName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profession">Profesión / Especialidad</Label>
              <Input
                id="profession"
                name="profession"
                disabled={loading}
                defaultValue={staff.profession || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                disabled={loading}
                defaultValue={staff.email || ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                disabled={loading}
                defaultValue={staff.phone || ''}
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
              {loading ? 'Actualizando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
