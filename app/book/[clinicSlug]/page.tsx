import { notFound } from 'next/navigation'
import { getClinicBySlug } from './actions'
import { BookingWidget } from './booking-widget'

interface BookingPageProps {
  params: {
    clinicSlug: string
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const clinic = await getClinicBySlug(params.clinicSlug)

  if (!clinic) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h1 className="text-3xl font-bold">{clinic.name}</h1>
            {clinic.address && (
              <p className="mt-2 text-blue-100">{clinic.address}, {clinic.city}</p>
            )}
            {clinic.phone && (
              <p className="mt-1 text-blue-100">📞 {clinic.phone}</p>
            )}
          </div>

          {/* Widget */}
          <div className="p-6">
            <BookingWidget clinicId={clinic.id} />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-600 text-sm">
          <p>Sistema de reservas en línea</p>
        </div>
      </div>
    </div>
  )
}
