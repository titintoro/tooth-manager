'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Stethoscope } from 'lucide-react'
import { EditTreatmentDialog } from './edit-treatment-dialog'
import { DeleteTreatmentDialog } from './delete-treatment-dialog'
import { Decimal } from '@prisma/client/runtime/library'

interface TreatmentType {
  id: string
  name: string
  description: string | null
  code: string | null
  defaultDuration: number
  estimatedPrice: Decimal | null
  currency: string
  color: string | null
  isActive: boolean
  _count: {
    appointments: number
  }
}

interface TreatmentsTableProps {
  treatments: TreatmentType[]
}

export function TreatmentsTable({ treatments }: TreatmentsTableProps) {
  const [editingTreatment, setEditingTreatment] = useState<TreatmentType | null>(null)
  const [deletingTreatment, setDeletingTreatment] = useState<TreatmentType | null>(null)

  if (treatments.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <Stethoscope className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-lg font-medium mb-2">No hay tratamientos registrados</p>
        <p className="text-sm text-muted-foreground">
          Comienza agregando tu primer tipo de tratamiento
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Duración (min)</TableHead>
              <TableHead>Precio estimado</TableHead>
              <TableHead>Citas totales</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {treatments.map((treatment) => (
              <TableRow key={treatment.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {treatment.color && (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: treatment.color }}
                      />
                    )}
                    <div>
                      <p className="font-medium">{treatment.name}</p>
                      {treatment.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {treatment.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {treatment.code || '-'}
                </TableCell>
                <TableCell className="text-center">{treatment.defaultDuration}</TableCell>
                <TableCell>
                  {treatment.estimatedPrice
                    ? `${treatment.currency} ${treatment.estimatedPrice.toString()}`
                    : '-'}
                </TableCell>
                <TableCell className="text-center">{treatment._count.appointments}</TableCell>
                <TableCell>
                  <Badge variant={treatment.isActive ? 'default' : 'secondary'}>
                    {treatment.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTreatment(treatment)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingTreatment(treatment)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingTreatment && (
        <EditTreatmentDialog
          treatment={editingTreatment}
          open={!!editingTreatment}
          onOpenChange={(open) => !open && setEditingTreatment(null)}
        />
      )}

      {deletingTreatment && (
        <DeleteTreatmentDialog
          treatment={deletingTreatment}
          open={!!deletingTreatment}
          onOpenChange={(open) => !open && setDeletingTreatment(null)}
        />
      )}
    </>
  )
}
