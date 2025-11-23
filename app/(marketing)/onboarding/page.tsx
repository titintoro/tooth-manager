import { getRequiredSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
  const session = await getRequiredSession()
  
  // Si ya tiene clínica, redirigir al dashboard
  if (session.user.currentClinicId) {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Bienvenido a Tooth Manager</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Parece que no tienes ninguna clínica asignada.
        </p>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            Contacta al administrador de tu clínica para que te agregue como miembro,
            o crea una nueva cuenta con tu propia clínica.
          </p>
        </div>
      </div>
    </div>
  )
}
