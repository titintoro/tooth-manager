import { getTreatmentTypes } from './actions'
import { TreatmentsTable } from './treatments-table'
import { CreateTreatmentDialog } from './create-treatment-dialog'

export default async function TratamientosPage() {
  const treatments = await getTreatmentTypes()

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tipos de Tratamiento</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los tratamientos disponibles en tu clínica
          </p>
        </div>
        <CreateTreatmentDialog />
      </div>

      <TreatmentsTable treatments={treatments} />
    </div>
  )
}
