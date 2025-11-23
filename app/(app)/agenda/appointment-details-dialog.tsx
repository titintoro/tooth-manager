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
import { Badge } from '@/components/ui/badge'
import {
  updateAppointmentStatus,
  deleteAppointment,
} from './actions'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
} from 'lucide-react'
import { AppointmentStatus } from '@prisma/client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AppointmentDetailsDialogProps {
  appointmentId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppointmentDetailsDialog({
  appointmentId,
  open,
  onOpenChange,
}: AppointmentDetailsDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  async function handleStatusChange(status: AppointmentStatus) {
    setLoading(true)
    try {
      await updateAppointmentStatus(appointmentId, status)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteAppointment(appointmentId)
      setDeleteDialogOpen(false)
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error deleting appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la cita</DialogTitle>
            <DialogDescription>
              Ver y gestionar información de la cita
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Estado de la cita</h3>
              <Badge>Programada</Badge>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Paciente</p>
                  <p className="font-medium">Cargando...</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Fecha</p>
                  <p className="font-medium">Cargando...</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Horario</p>
                  <p className="font-medium">Cargando...</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(AppointmentStatus.CONFIRMED)}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(AppointmentStatus.COMPLETED)}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar completada
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(AppointmentStatus.NO_SHOW)}
                disabled={loading}
              >
                <Ban className="h-4 w-4 mr-2" />
                No asistió
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange(AppointmentStatus.CANCELLED)}
                disabled={loading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              {loading ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
