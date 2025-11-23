import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, clinicName } = body

    // Validaciones
    if (!name || !email || !password || !clinicName) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear slug único para la clínica
    const baseSlug = clinicName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/-+/g, '-') // Múltiples guiones a uno solo
      .trim()

    let slug = baseSlug
    let counter = 1

    // Verificar que el slug sea único
    while (await prisma.clinic.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Crear usuario, clínica, membership y suscripción en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear usuario
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          emailVerified: new Date(), // Auto-verificado para simplificar
        },
      })

      // 2. Crear clínica
      const clinic = await tx.clinic.create({
        data: {
          name: clinicName,
          slug,
          timezone: 'America/Mexico_City',
          slotDuration: 30,
        },
      })

      // 3. Crear membership con rol OWNER
      await tx.userClinicMembership.create({
        data: {
          userId: user.id,
          clinicId: clinic.id,
          role: 'OWNER',
        },
      })

      // 4. Crear suscripción TRIAL
      const trialEndDate = new Date()
      trialEndDate.setDate(trialEndDate.getDate() + 30) // 30 días de prueba

      await tx.clinicSubscription.create({
        data: {
          clinicId: clinic.id,
          plan: 'TRIAL',
          status: 'TRIALING',
          trialEndsAt: trialEndDate,
          maxStaffMembers: 5,
          maxAppointmentsMonth: 100,
        },
      })

      return { user, clinic }
    })

    return NextResponse.json(
      {
        message: 'Cuenta creada exitosamente',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
        clinic: {
          id: result.clinic.id,
          name: result.clinic.name,
          slug: result.clinic.slug,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error al crear la cuenta. Por favor, intenta nuevamente.' },
      { status: 500 }
    )
  }
}
