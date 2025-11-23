'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import { Input } from '@/components/ui/input'
import { Search, Eye, Pencil, Trash2, Users } from 'lucide-react'
import { EditPatientDialog } from './edit-patient-dialog'
import { DeletePatientDialog } from './delete-patient-dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Patient {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  isActive: boolean
  lastAppointmentDate: Date | null
  _count: {
    appointments: number
  }
}

interface PatientsTableProps {
  patients: Patient[]
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) {
      params.set('q', searchQuery)
    }
    router.push(`/pacientes?${params.toString()}`)
  }

  if (patients.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-16 border rounded-lg">
        <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
        <p className="text-lg font-medium mb-2">No hay pacientes registrados</p>
        <p className="text-sm text-muted-foreground">
          Comienza agregando tu primer paciente
        </p>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {patients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          No se encontraron pacientes con el criterio de búsqueda.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Última cita</TableHead>
                <TableHead>Citas totales</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {patient.email || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {patient.phone || '-'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {patient.lastAppointmentDate
                      ? format(new Date(patient.lastAppointmentDate), 'dd MMM yyyy', {
                          locale: es,
                        })
                      : 'Sin citas'}
                  </TableCell>
                  <TableCell className="text-center">
                    {patient._count.appointments}
                  </TableCell>
                  <TableCell>
                    <Badge variant={patient.isActive ? 'default' : 'secondary'}>
                      {patient.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/pacientes/${patient.id}`}>
                        <Button variant="ghost" size="icon" title="Ver detalle">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingPatient(patient)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPatient(patient)}
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
      )}

      {editingPatient && (
        <EditPatientDialog
          patient={editingPatient}
          open={!!editingPatient}
          onOpenChange={(open) => !open && setEditingPatient(null)}
        />
      )}

      {deletingPatient && (
        <DeletePatientDialog
          patient={deletingPatient}
          open={!!deletingPatient}
          onOpenChange={(open) => !open && setDeletingPatient(null)}
        />
      )}
    </>
  )
}
