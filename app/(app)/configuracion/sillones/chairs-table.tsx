'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { EditChairDialog } from './edit-chair-dialog'
import { DeleteChairDialog } from './delete-chair-dialog'
import { useState } from 'react'

interface Chair {
  id: string
  name: string
  location: string | null
  isActive: boolean
}

interface ChairsTableProps {
  chairs: Chair[]
}

export function ChairsTable({ chairs }: ChairsTableProps) {
  const [editingChair, setEditingChair] = useState<Chair | null>(null)
  const [deletingChair, setDeletingChair] = useState<Chair | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chairs.map((chair) => (
            <TableRow key={chair.id}>
              <TableCell className="font-medium">{chair.name}</TableCell>
              <TableCell>
                {chair.location || (
                  <span className="text-muted-foreground text-sm">Sin ubicación</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={chair.isActive ? 'default' : 'secondary'}>
                  {chair.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingChair(chair)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingChair(chair)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingChair && (
        <EditChairDialog
          chair={editingChair}
          open={!!editingChair}
          onOpenChange={(open: boolean) => !open && setEditingChair(null)}
        />
      )}

      {deletingChair && (
        <DeleteChairDialog
          chair={deletingChair}
          open={!!deletingChair}
          onOpenChange={(open: boolean) => !open && setDeletingChair(null)}
        />
      )}
    </>
  )
}
