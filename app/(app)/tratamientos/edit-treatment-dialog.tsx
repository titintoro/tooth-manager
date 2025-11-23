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
import { updateTreatmentType } from './actions'
import { useRouter } from 'next/navigation'
import { Decimal } from '@prisma/client/runtime/library'

interface TreatmentType {
  id: string
  name: string
  description: string | null
  code: string | null
  defaultDuration: number
  estimatedPrice: Decimal | null
  color: string | null
  isActive: boolean
}

interface EditTreatmentDialogProps {
  treatment: TreatmentType
  open: boolean
  onOpenChange: (open: boolean) => void
}

const COLORS = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#ef4444',
  '#6366f1',
]

export function EditTreatmentDialog({
  treatment,
  open,
  onOpenChange,
}: EditTreatmentDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(treatment.isActive)
  const [selectedColor, setSelectedColor] = useState(treatment.color || COLORS[0])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      await updateTreatmentType(treatment.id, {
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        code: formData.get('code') as string || undefined,
        defaultDuration: parseInt(formData.get('defaultDuration') as string),
        estimatedPrice: formData.get('estimatedPrice') as string || undefined,
        color: selectedColor,
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
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar tipo de tratamiento</DialogTitle>
            <DialogDescription>
              Actualiza la información del tratamiento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del tratamiento *</Label>
              <Input
                id="name"
                name="name"
                required
                minLength={2}
                disabled={loading}
                defaultValue={treatment.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                disabled={loading}
                defaultValue={treatment.description || ''}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código interno</Label>
                <Input
                  id="code"
                  name="code"
                  disabled={loading}
                  defaultValue={treatment.code || ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultDuration">Duración (minutos) *</Label>
                <Input
                  id="defaultDuration"
                  name="defaultDuration"
                  type="number"
                  required
                  min="1"
                  disabled={loading}
                  defaultValue={treatment.defaultDuration}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedPrice">Precio estimado (MXN)</Label>
              <Input
                id="estimatedPrice"
                name="estimatedPrice"
                type="number"
                step="0.01"
                min="0"
                disabled={loading}
                defaultValue={treatment.estimatedPrice?.toString() || ''}
              />
            </div>

            <div className="space-y-2">
              <Label>Color para calendario</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 ${
                      selectedColor === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    disabled={loading}
                  />
                ))}
              </div>
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
