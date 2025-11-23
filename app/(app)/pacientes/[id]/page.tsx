import { notFound } from 'next/navigation'
import { getPatientById } from '../actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Mail, Phone, MapPin, FileText } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface PageProps {
  params: { id: string }
}

export default async function PatientDetailPage({ params }: PageProps) {
  try {
    const patient = await getPatientById(params.id)

    const futureAppointments = patient.appointments.filter(
      (apt) => new Date(apt.start) >= new Date()
    )
    const pastAppointments = patient.appointments.filter(
      (apt) => new Date(apt.start) < new Date()
    )

    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/pacientes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground mt-1">Información del paciente</p>
          </div>
          <Badge variant={patient.isActive ? 'default' : 'secondary'}>
            {patient.isActive ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{patient.email}</p>
                  </div>
                </div>
              )}

              {patient.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{patient.phone}</p>
                  </div>
                </div>
              )}

              {(patient.address || patient.city) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="font-medium">
                      {patient.address}
                      {patient.address && patient.city && ', '}
                      {patient.city}
                    </p>
                  </div>
                </div>
              )}

              {patient.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha de nacimiento</p>
                    <p className="font-medium">
                      {format(new Date(patient.dateOfBirth), "dd 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {patient.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notas administrativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-1" />
                  <p className="text-sm whitespace-pre-wrap">{patient.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Citas futuras</CardTitle>
            <CardDescription>
              {futureAppointments.length === 0
                ? 'No hay citas programadas'
                : `${futureAppointments.length} cita(s) programada(s)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {futureAppointments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No hay citas futuras programadas
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {futureAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {format(new Date(appointment.start), "dd MMM yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {appointment.treatmentType?.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: appointment.treatmentType.color }}
                            />
                          )}
                          {appointment.treatmentType?.name || 'Sin especificar'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {appointment.staffMember
                          ? `${appointment.staffMember.firstName} ${appointment.staffMember.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === 'CONFIRMED'
                              ? 'default'
                              : appointment.status === 'SCHEDULED'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {appointment.status === 'CONFIRMED'
                            ? 'Confirmada'
                            : appointment.status === 'SCHEDULED'
                            ? 'Programada'
                            : appointment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historial de citas</CardTitle>
            <CardDescription>
              {pastAppointments.length === 0
                ? 'No hay citas anteriores'
                : `${pastAppointments.length} cita(s) anterior(es)`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pastAppointments.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No hay citas anteriores
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha y hora</TableHead>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAppointments.slice(0, 10).map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        {format(new Date(appointment.start), "dd MMM yyyy 'a las' HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {appointment.treatmentType?.color && (
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: appointment.treatmentType.color }}
                            />
                          )}
                          {appointment.treatmentType?.name || 'Sin especificar'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {appointment.staffMember
                          ? `${appointment.staffMember.firstName} ${appointment.staffMember.lastName}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === 'COMPLETED'
                              ? 'default'
                              : appointment.status === 'CANCELLED'
                              ? 'destructive'
                              : appointment.status === 'NO_SHOW'
                              ? 'outline'
                              : 'secondary'
                          }
                        >
                          {appointment.status === 'COMPLETED'
                            ? 'Completada'
                            : appointment.status === 'CANCELLED'
                            ? 'Cancelada'
                            : appointment.status === 'NO_SHOW'
                            ? 'No asistió'
                            : appointment.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    )
  } catch {
    notFound()
  }
}
