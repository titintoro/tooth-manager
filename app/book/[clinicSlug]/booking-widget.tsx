'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Check, ChevronRight, Clock, User, Stethoscope, Calendar as CalendarIcon } from 'lucide-react'
import {
  getActiveTreatmentTypes,
  getActiveStaffMembers,
  getAvailableSlots,
  createPublicAppointment,
} from './actions'

type Step = 'treatment' | 'staff' | 'datetime' | 'patient' | 'confirmation'

interface Treatment {
  id: string
  name: string
  description: string | null
  defaultDuration: number
  color: string | null
}

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  profession: string | null
  color: string | null
}

interface TimeSlot {
  start: string
  end: string
  available: boolean
}

interface AppointmentData {
  patient: {
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  }
  treatmentType: {
    name: string
  } | null
  staffMember: {
    firstName: string
    lastName: string
  } | null
  start: Date | string
}

export function BookingWidget({ clinicId }: { clinicId: string }) {
  const [step, setStep] = useState<Step>('treatment')
  const [loading, setLoading] = useState(false)

  // Data
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])

  // Selections
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)

  // Patient data
  const [patientData, setPatientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  })

  // Confirmation
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false)
  const [confirmationData, setConfirmationData] = useState<AppointmentData | null>(null)

  // Load treatments on mount
  const loadTreatments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getActiveTreatmentTypes(clinicId)
      setTreatments(data)
    } catch (error) {
      console.error('Error loading treatments:', error)
    }
    setLoading(false)
  }, [clinicId])

  const loadStaff = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getActiveStaffMembers(clinicId)
      setStaffMembers(data)
    } catch (error) {
      console.error('Error loading staff:', error)
    }
    setLoading(false)
  }, [clinicId])

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDate || !selectedTreatment) return

    setLoading(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const slots = await getAvailableSlots(
        clinicId,
        dateStr,
        selectedTreatment.defaultDuration,
        selectedStaff?.id
      )
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error loading slots:', error)
      setAvailableSlots([])
    }
    setLoading(false)
  }, [clinicId, selectedDate, selectedTreatment, selectedStaff])

  useEffect(() => {
    loadTreatments()
  }, [loadTreatments])

  // Load staff when treatment is selected
  useEffect(() => {
    if (selectedTreatment) {
      loadStaff()
    }
  }, [selectedTreatment, loadStaff])

  // Load slots when date is selected
  useEffect(() => {
    if (selectedDate && selectedTreatment) {
      loadAvailableSlots()
    }
  }, [selectedDate, selectedTreatment, selectedStaff, loadAvailableSlots])

  const handleTreatmentSelect = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setStep('staff')
  }

  const handleStaffSelect = (staffId: string | 'any') => {
    if (staffId === 'any') {
      setSelectedStaff(null)
    } else {
      const staff = staffMembers.find(s => s.id === staffId)
      setSelectedStaff(staff || null)
    }
    setStep('datetime')
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    setStep('patient')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTreatment || !selectedSlot) return

    setLoading(true)
    try {
      const result = await createPublicAppointment({
        clinicId,
        treatmentTypeId: selectedTreatment.id,
        staffMemberId: selectedStaff?.id,
        start: selectedSlot.start,
        duration: selectedTreatment.defaultDuration,
        patientData: {
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email || undefined,
          phone: patientData.phone || undefined,
        },
        notes: patientData.notes || undefined,
      })

      if (result.success && result.appointment) {
        setConfirmationData(result.appointment)
        setAppointmentConfirmed(true)
        setStep('confirmation')
      } else {
        alert(result.error || 'Error al crear la cita')
      }
    } catch (error) {
      console.error('Error creating appointment:', error)
      alert('Error al crear la cita')
    }
    setLoading(false)
  }

  // Render step content
  const renderStepContent = () => {
    switch (step) {
      case 'treatment':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Selecciona un tratamiento</h2>
              <p className="text-gray-600">¿Qué tipo de consulta necesitas?</p>
            </div>

            <div className="grid gap-3">
              {treatments.map((treatment) => (
                <button
                  key={treatment.id}
                  onClick={() => handleTreatmentSelect(treatment)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: treatment.color || '#3b82f6' }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-blue-600">
                        {treatment.name}
                      </h3>
                      {treatment.description && (
                        <p className="text-sm text-gray-600 mt-1">{treatment.description}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Duración: {treatment.defaultDuration} minutos
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 'staff':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Selecciona un profesional</h2>
              <p className="text-gray-600">¿Tienes preferencia de profesional?</p>
            </div>

            <div className="grid gap-3">
              <button
                onClick={() => handleStaffSelect('any')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-blue-600">
                      Cualquier profesional disponible
                    </h3>
                    <p className="text-sm text-gray-600">No tengo preferencia</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                </div>
              </button>

              {staffMembers.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => handleStaffSelect(staff.id)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: staff.color || '#3b82f6' }}
                    >
                      <span className="text-white font-semibold text-lg">
                        {staff.firstName[0]}{staff.lastName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-blue-600">
                        {staff.firstName} {staff.lastName}
                      </h3>
                      {staff.profession && (
                        <p className="text-sm text-gray-600">{staff.profession}</p>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            <Button variant="outline" onClick={() => setStep('treatment')} className="w-full">
              Volver
            </Button>
          </div>
        )

      case 'datetime':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Selecciona fecha y hora</h2>
              <p className="text-gray-600">Elige el día y horario que prefieras</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <Label className="mb-2 block">Fecha</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  locale={es}
                  className="rounded-md border"
                />
              </div>

              {/* Time slots */}
              <div>
                <Label className="mb-2 block">Hora disponible</Label>
                {!selectedDate ? (
                  <p className="text-gray-500 text-sm">Selecciona una fecha primero</p>
                ) : loading ? (
                  <p className="text-gray-500 text-sm">Cargando horarios...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-gray-500 text-sm">No hay horarios disponibles para esta fecha</p>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlotSelect(slot)}
                        className="w-full p-3 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {format(parseISO(slot.start), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button variant="outline" onClick={() => setStep('staff')} className="w-full">
              Volver
            </Button>
          </div>
        )

      case 'patient':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tus datos</h2>
              <p className="text-gray-600">Introduce tus datos para confirmar la reserva</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre *</Label>
                  <Input
                    id="firstName"
                    required
                    value={patientData.firstName}
                    onChange={(e) => setPatientData({ ...patientData, firstName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellidos *</Label>
                  <Input
                    id="lastName"
                    required
                    value={patientData.lastName}
                    onChange={(e) => setPatientData({ ...patientData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={patientData.email}
                  onChange={(e) => setPatientData({ ...patientData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={patientData.phone}
                  onChange={(e) => setPatientData({ ...patientData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={patientData.notes}
                  onChange={(e) => setPatientData({ ...patientData, notes: e.target.value })}
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Resumen de tu reserva</h3>
                <div className="text-sm space-y-1 text-gray-700">
                  <p>
                    <Stethoscope className="inline h-4 w-4 mr-2" />
                    {selectedTreatment?.name}
                  </p>
                  {selectedStaff && (
                    <p>
                      <User className="inline h-4 w-4 mr-2" />
                      {selectedStaff.firstName} {selectedStaff.lastName}
                    </p>
                  )}
                  <p>
                    <CalendarIcon className="inline h-4 w-4 mr-2" />
                    {selectedDate && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p>
                    <Clock className="inline h-4 w-4 mr-2" />
                    {selectedSlot && format(parseISO(selectedSlot.start), 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep('datetime')} className="flex-1">
                  Volver
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Confirmando...' : 'Confirmar reserva'}
                </Button>
              </div>
            </form>
          </div>
        )

      case 'confirmation':
        return (
          <div className="space-y-6 text-center py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">¡Reserva confirmada!</h2>
              <p className="text-gray-600">
                Tu cita ha sido registrada correctamente. Te esperamos el día indicado.
              </p>
            </div>

            {confirmationData && (
              <div className="bg-gray-50 p-6 rounded-lg space-y-3 text-left max-w-md mx-auto">
                <h3 className="font-semibold text-center mb-4">Detalles de tu cita</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Paciente:</strong> {confirmationData.patient.firstName} {confirmationData.patient.lastName}
                  </p>
                  {confirmationData.treatmentType && (
                    <p>
                      <strong>Tratamiento:</strong> {confirmationData.treatmentType.name}
                    </p>
                  )}
                  {confirmationData.staffMember && (
                    <p>
                      <strong>Profesional:</strong> {confirmationData.staffMember.firstName} {confirmationData.staffMember.lastName}
                    </p>
                  )}
                  <p>
                    <strong>Fecha:</strong> {format(new Date(confirmationData.start), "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p>
                    <strong>Hora:</strong> {format(new Date(confirmationData.start), 'HH:mm', { locale: es })}
                  </p>
                  {confirmationData.patient.email && (
                    <p className="text-xs text-gray-600 mt-4">
                      📧 Te hemos enviado un correo de confirmación a {confirmationData.patient.email}
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                // Reset form
                setStep('treatment')
                setSelectedTreatment(null)
                setSelectedStaff(null)
                setSelectedDate(undefined)
                setSelectedSlot(null)
                setPatientData({ firstName: '', lastName: '', email: '', phone: '', notes: '' })
                setAppointmentConfirmed(false)
                setConfirmationData(null)
              }}
              variant="outline"
            >
              Reservar otra cita
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      {!appointmentConfirmed && (
        <div className="flex items-center justify-center gap-2">
          {['treatment', 'staff', 'datetime', 'patient'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : index < ['treatment', 'staff', 'datetime', 'patient'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`w-8 h-0.5 ${
                    index < ['treatment', 'staff', 'datetime', 'patient'].indexOf(step)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step content */}
      {renderStepContent()}
    </div>
  )
}
