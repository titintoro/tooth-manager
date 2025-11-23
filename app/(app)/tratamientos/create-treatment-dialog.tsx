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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import { createTreatmentType } from './actions'
import { useRouter } from 'next/navigation'

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

export function CreateTreatmentDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      await createTreatmentType({
        name: formData.get('name') as string,
        description: formData.get('description') as string || undefined,
        code: formData.get('code') as string || undefined,
        defaultDuration: parseInt(formData.get('defaultDuration') as string),
        estimatedPrice: formData.get('estimatedPrice') as string || undefined,
        color: selectedColor,
      })

      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agregar tratamiento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Agregar tipo de tratamiento</DialogTitle>
            <DialogDescription>
              Define un nuevo tipo de tratamiento para tu clínica
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
                placeholder="Ej: Limpieza dental"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                disabled={loading}
                placeholder="Descripción breve del tratamiento..."
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
                  placeholder="Ej: LIM-001"
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
                  placeholder="30"
                  defaultValue="30"
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
                placeholder="500.00"
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear tratamiento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
