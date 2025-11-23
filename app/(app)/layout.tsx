import { ReactNode } from 'react'
import { getClinicSession, getUserClinics, getCurrentClinic } from '@/lib/auth-helpers'
import { AppSidebar } from '@/components/app-sidebar'
import { AppTopbar } from '@/components/app-topbar'

export default async function AppLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user, role } = await getClinicSession()
  
  // Obtener clínicas del usuario y clínica actual
  const userClinics = await getUserClinics()
  const currentClinic = await getCurrentClinic()

  const clinics = userClinics.map((m: { clinic: { id: string; name: string } }) => ({
    id: m.clinic.id,
    name: m.clinic.name,
  }))

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile, visible on lg */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <AppSidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <AppTopbar 
          user={user} 
          role={role}
          clinicName={currentClinic.name}
          clinics={clinics}
        />
        
        <main className="flex-1 overflow-y-auto bg-muted/5">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
