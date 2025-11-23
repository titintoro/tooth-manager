import { getWaitlistEntries, getWaitlistStats } from './actions'
import { WaitlistTable } from './waitlist-table'
import { CreateWaitlistDialog } from './create-waitlist-dialog'

export default async function ListaEsperaPage() {
  const [entries, stats] = await Promise.all([
    getWaitlistEntries({ status: 'WAITING' }),
    getWaitlistStats(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lista de Espera</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los pacientes que esperan disponibilidad para sus citas
          </p>
        </div>
        <CreateWaitlistDialog />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">En Espera</p>
          <p className="text-2xl font-bold text-blue-600">{stats.waiting}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Notificados</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.notified}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Agendados</p>
          <p className="text-2xl font-bold text-green-600">{stats.scheduled}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
      </div>

      {/* Table */}
      <WaitlistTable entries={entries} />
    </div>
  )
}
