'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { EditStaffDialog } from './edit-staff-dialog'
import { DeleteStaffDialog } from './delete-staff-dialog'
import { useState } from 'react'

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  profession: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  user: {
    email: string
    name: string | null
  } | null
}

interface StaffTableProps {
  staff: StaffMember[]
}

export function StaffTable({ staff }: StaffTableProps) {
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Profesión</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.map((member) => (
            <TableRow key={member.id}>
              <TableCell className="font-medium">{member.firstName} {member.lastName}</TableCell>
              <TableCell>{member.profession || '-'}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {member.email || '-'}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {member.phone || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={member.isActive ? 'default' : 'secondary'}>
                  {member.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingStaff(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingStaff(member)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingStaff && (
        <EditStaffDialog
          staff={editingStaff}
          open={!!editingStaff}
          onOpenChange={(open: boolean) => !open && setEditingStaff(null)}
        />
      )}

      {deletingStaff && (
        <DeleteStaffDialog
          staff={deletingStaff}
          open={!!deletingStaff}
          onOpenChange={(open: boolean) => !open && setDeletingStaff(null)}
        />
      )}
    </>
  )
}
