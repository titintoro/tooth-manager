import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-4">Acceso no autorizado</h1>
        <p className="text-lg text-muted-foreground mb-8">
          No tienes los permisos necesarios para acceder a esta página.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Volver al Dashboard
        </Link>
      </div>
    </div>
  )
}
