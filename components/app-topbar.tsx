'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, Building2, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { AppSidebar } from './app-sidebar'
import { UserRole } from '@prisma/client'

interface AppTopbarProps {
  user: {
    name?: string | null
    email: string
    image?: string | null
  }
  role?: UserRole
  clinicName?: string
  clinics?: Array<{
    id: string
    name: string
  }>
}

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  DOCTOR: 'Doctor',
  RECEPTIONIST: 'Recepcionista',
}

const roleBadgeVariant: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OWNER: 'default',
  ADMIN: 'secondary',
  DOCTOR: 'outline',
  RECEPTIONIST: 'outline',
}

export function AppTopbar({ user, role, clinicName, clinics = [] }: AppTopbarProps) {
  const [isChangingClinic, setIsChangingClinic] = useState(false)

  const handleClinicChange = async (clinicId: string) => {
    setIsChangingClinic(true)
    try {
      // Aquí implementaremos el cambio de clínica usando session.update()
      console.log('Cambiar a clínica:', clinicId)
      // await update({ currentClinicId: clinicId })
      window.location.reload()
    } catch (error) {
      console.error('Error al cambiar de clínica:', error)
    } finally {
      setIsChangingClinic(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  const userInitials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <AppSidebar />
        </SheetContent>
      </Sheet>

      {/* Separator for mobile */}
      <div className="h-6 w-px bg-border lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Clinic selector */}
        {clinics.length > 0 && (
          <div className="flex items-center gap-x-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-sm font-medium"
                  disabled={isChangingClinic}
                >
                  <span className="hidden sm:inline">{clinicName || 'Seleccionar clínica'}</span>
                  <span className="sm:hidden">{clinicName?.slice(0, 15) || 'Clínica'}</span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Mis Clínicas</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {clinics.map((clinic) => (
                  <DropdownMenuItem
                    key={clinic.id}
                    onClick={() => handleClinicChange(clinic.id)}
                    className="cursor-pointer"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{clinic.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="flex flex-1 justify-end gap-x-4 lg:gap-x-6">
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative flex items-center gap-2 pl-2 pr-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                  <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                </Avatar>
                <div className="hidden lg:flex lg:flex-col lg:items-start">
                  <span className="text-sm font-medium">{user.name || user.email}</span>
                  {role && (
                    <Badge variant={roleBadgeVariant[role]} className="text-xs h-5">
                      {roleLabels[role]}
                    </Badge>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name || 'Usuario'}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/configuracion/perfil'}>
                <User className="mr-2 h-4 w-4" />
                <span>Mi perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/configuracion'}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
