import { getAppointments, getResources } from './actions'
import { WeeklyCalendar } from './weekly-calendar'
import { startOfWeek, endOfWeek } from 'date-fns'

interface PageProps {
  searchParams: {
    date?: string
    view?: 'chair' | 'staff'
  }
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const currentDate = searchParams.date ? new Date(searchParams.date) : new Date()
  const viewMode = searchParams.view || 'chair'

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })

  const [appointments, resources] = await Promise.all([
    getAppointments(weekStart.toISOString(), weekEnd.toISOString()),
    getResources(),
  ])

  return (
    <div className="p-6 max-w-full">
      <WeeklyCalendar
        appointments={appointments}
        chairs={resources.chairs}
        staffMembers={resources.staffMembers}
        currentDate={currentDate}
        viewMode={viewMode}
      />
    </div>
  )
}
