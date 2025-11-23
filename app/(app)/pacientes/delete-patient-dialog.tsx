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
import { deletePatient } from './actions'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

interface Patient {
  id: string
  firstName: string
  lastName: string
}

interface DeletePatientDialogProps {
  patient: Patient
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeletePatientDialog({ patient, open, onOpenChange }: DeletePatientDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setLoading(true)
    setError('')

    try {
      await deletePatient(patient.id)
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Eliminar paciente</DialogTitle>
          </div>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente a{' '}
            <span className="font-medium">
              {patient.firstName} {patient.lastName}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
