import { getPatients } from './actions'
import { PatientsTable } from './patients-table'
import { CreatePatientDialog } from './create-patient-dialog'

interface PageProps {
  searchParams: { q?: string }
}

export default async function PacientesPage({ searchParams }: PageProps) {
  const patients = await getPatients(searchParams.q)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona la información de tus pacientes
          </p>
        </div>
        <CreatePatientDialog />
      </div>

      <PatientsTable patients={patients} />
    </div>
  )
}
