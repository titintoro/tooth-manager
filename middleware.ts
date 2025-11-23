import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Rutas que requieren autenticación
const protectedPaths = [
  '/dashboard',
  '/appointments',
  '/patients',
  '/staff',
  '/settings',
  '/waitlist',
]

// Rutas públicas (no requieren autenticación)
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
]

// Rutas de API que requieren autenticación
const protectedApiPaths = [
  '/api/appointments',
  '/api/patients',
  '/api/staff',
  '/api/clinics',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Permitir rutas de NextAuth
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }
  
  // Obtener token de sesión
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })
  
  // Verificar si la ruta requiere autenticación
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isProtectedApiPath = protectedApiPaths.some(path => pathname.startsWith(path))
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // Redirigir a login si intenta acceder a ruta protegida sin autenticación
  if ((isProtectedPath || isProtectedApiPath) && !token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  
  // Redirigir a dashboard si ya está autenticado e intenta acceder a rutas públicas
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Verificar que el usuario tenga una clínica asignada para rutas protegidas
  if (isProtectedPath && token && !token.currentClinicId) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }
  
  // Para API routes, agregar headers con información de la sesión
  if (isProtectedApiPath && token) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', token.id as string)
    if (token.currentClinicId) {
      requestHeaders.set('x-clinic-id', token.currentClinicId as string)
    }
    if (token.role) {
      requestHeaders.set('x-user-role', token.role as string)
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}