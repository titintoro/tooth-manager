import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Clock, TrendingUp, CheckCircle2, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gradient-to-b from-background to-muted/20">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              Optimiza la agenda de tu clínica dental con{' '}
              <span className="text-primary">IA</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Motor de optimización de agenda + CRM ligero para clínicas dentales 
              que no quieren cambiar su PMS. Gestiona pacientes, citas y lista de espera 
              en una sola plataforma.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Empezar gratis
                  <Zap className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/precios">Ver precios</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Sin tarjeta de crédito • Prueba gratuita de 30 días
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Todo lo que necesitas</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas diseñadas específicamente para clínicas dentales
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Agenda Inteligente</CardTitle>
                <CardDescription>
                  Gestiona citas con optimización automática de horarios y recordatorios
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Gestión de Pacientes</CardTitle>
                <CardDescription>
                  CRM ligero con historial, tratamientos y seguimiento completo
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Lista de Espera</CardTitle>
                <CardDescription>
                  Aprovecha cancelaciones con notificaciones automáticas a pacientes en espera
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Dashboard & KPIs</CardTitle>
                <CardDescription>
                  Métricas en tiempo real sobre ocupación, ingresos y productividad
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CheckCircle2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Multi-clínica</CardTitle>
                <CardDescription>
                  Gestiona múltiples clínicas desde una sola cuenta con roles diferenciados
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Sin Integración Compleja</CardTitle>
                <CardDescription>
                  No necesitas cambiar tu PMS actual. Funciona de forma independiente
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            ¿Listo para optimizar tu clínica?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a las clínicas que ya están mejorando su productividad
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/register">Empezar gratis</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
