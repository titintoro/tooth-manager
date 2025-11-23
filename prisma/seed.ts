import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Crear usuario demo
  const hashedPassword = await bcrypt.hash('demo123', 10)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@toothmanager.com' },
    update: {},
    create: {
      email: 'demo@toothmanager.com',
      name: 'Usuario Demo',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  })
  console.log('✅ Usuario demo creado:', demoUser.email)

  // Crear clínica demo
  const demoClinic = await prisma.clinic.upsert({
    where: { slug: 'clinica-demo' },
    update: {},
    create: {
      name: 'Clínica Dental Demo',
      slug: 'clinica-demo',
      email: 'contacto@clinicademo.com',
      phone: '+52 555 123 4567',
      address: 'Av. Principal 123',
      city: 'Ciudad de México',
      country: 'México',
      timezone: 'America/Mexico_City',
      businessHoursStart: '08:00',
      businessHoursEnd: '20:00',
      slotDuration: 30,
    },
  })
  console.log('✅ Clínica demo creada:', demoClinic.name)

  // Crear membresía OWNER para el usuario demo
  await prisma.userClinicMembership.upsert({
    where: {
      userId_clinicId: {
        userId: demoUser.id,
        clinicId: demoClinic.id,
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      clinicId: demoClinic.id,
      role: 'OWNER',
    },
  })
  console.log('✅ Membresía OWNER creada')

  // Crear suscripción TRIAL
  await prisma.clinicSubscription.upsert({
    where: { clinicId: demoClinic.id },
    update: {},
    create: {
      clinicId: demoClinic.id,
      plan: 'TRIAL',
      status: 'TRIALING',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      maxStaffMembers: 5,
      maxAppointmentsMonth: 100,
    },
  })
  console.log('✅ Suscripción TRIAL creada')

  // Crear staff members
  const staffMembers = await Promise.all([
    prisma.staffMember.create({
      data: {
        clinicId: demoClinic.id,
        userId: demoUser.id,
        firstName: 'Dr. Juan',
        lastName: 'Pérez',
        email: demoUser.email,
        profession: 'Dentista General',
        licenseNumber: 'DEN-123456',
        color: '#3B82F6',
      },
    }),
    prisma.staffMember.create({
      data: {
        clinicId: demoClinic.id,
        firstName: 'Dra. María',
        lastName: 'González',
        email: 'maria@clinicademo.com',
        profession: 'Ortodoncista',
        licenseNumber: 'ORT-789012',
        color: '#8B5CF6',
      },
    }),
    prisma.staffMember.create({
      data: {
        clinicId: demoClinic.id,
        firstName: 'Dr. Carlos',
        lastName: 'Ramírez',
        email: 'carlos@clinicademo.com',
        profession: 'Endodoncista',
        licenseNumber: 'END-345678',
        color: '#10B981',
      },
    }),
  ])
  console.log(`✅ ${staffMembers.length} staff members creados`)

  // Crear tipos de tratamiento
  const treatmentTypes = await Promise.all([
    prisma.treatmentType.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Limpieza Dental',
        description: 'Limpieza dental profesional con pulido',
        code: 'LIM-001',
        defaultDuration: 30,
        estimatedPrice: 500,
        color: '#06B6D4',
      },
    }),
    prisma.treatmentType.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Consulta General',
        description: 'Revisión dental general',
        code: 'CON-001',
        defaultDuration: 30,
        estimatedPrice: 300,
        color: '#14B8A6',
      },
    }),
    prisma.treatmentType.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Ortodoncia - Revisión',
        description: 'Revisión de brackets y ajuste',
        code: 'ORT-001',
        defaultDuration: 45,
        estimatedPrice: 800,
        color: '#8B5CF6',
      },
    }),
    prisma.treatmentType.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Endodoncia',
        description: 'Tratamiento de conducto',
        code: 'END-001',
        defaultDuration: 90,
        estimatedPrice: 2500,
        color: '#EF4444',
      },
    }),
    prisma.treatmentType.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Blanqueamiento',
        description: 'Blanqueamiento dental profesional',
        code: 'BLA-001',
        defaultDuration: 60,
        estimatedPrice: 3000,
        color: '#F59E0B',
      },
    }),
  ])
  console.log(`✅ ${treatmentTypes.length} tipos de tratamiento creados`)

  // Crear sillones
  const chairs = await Promise.all([
    prisma.chair.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Sillón 1',
        location: 'Planta baja',
        displayOrder: 1,
      },
    }),
    prisma.chair.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Sillón 2',
        location: 'Planta baja',
        displayOrder: 2,
      },
    }),
    prisma.chair.create({
      data: {
        clinicId: demoClinic.id,
        name: 'Sillón 3',
        location: 'Primer piso',
        displayOrder: 3,
      },
    }),
  ])
  console.log(`✅ ${chairs.length} sillones creados`)

  // Crear pacientes demo
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        clinicId: demoClinic.id,
        firstName: 'Ana',
        lastName: 'Martínez',
        email: 'ana.martinez@email.com',
        phone: '+52 555 111 2222',
        dateOfBirth: new Date('1990-05-15'),
        notes: 'Paciente regular',
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: demoClinic.id,
        firstName: 'Luis',
        lastName: 'Hernández',
        email: 'luis.hernandez@email.com',
        phone: '+52 555 333 4444',
        dateOfBirth: new Date('1985-08-20'),
        notes: 'Alérgico a la penicilina',
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: demoClinic.id,
        firstName: 'Carmen',
        lastName: 'López',
        email: 'carmen.lopez@email.com',
        phone: '+52 555 555 6666',
        dateOfBirth: new Date('1995-03-10'),
      },
    }),
    prisma.patient.create({
      data: {
        clinicId: demoClinic.id,
        firstName: 'Roberto',
        lastName: 'Sánchez',
        email: 'roberto.sanchez@email.com',
        phone: '+52 555 777 8888',
        dateOfBirth: new Date('1988-11-25'),
      },
    }),
  ])
  console.log(`✅ ${patients.length} pacientes creados`)

  // Crear algunas citas de ejemplo
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const appointments = await Promise.all([
    prisma.appointment.create({
      data: {
        clinicId: demoClinic.id,
        patientId: patients[0].id,
        treatmentTypeId: treatmentTypes[0].id,
        staffMemberId: staffMembers[0].id,
        chairId: chairs[0].id,
        start: tomorrow,
        end: new Date(tomorrow.getTime() + 30 * 60 * 1000),
        status: 'SCHEDULED',
        notes: 'Primera cita del paciente',
      },
    }),
    prisma.appointment.create({
      data: {
        clinicId: demoClinic.id,
        patientId: patients[1].id,
        treatmentTypeId: treatmentTypes[2].id,
        staffMemberId: staffMembers[1].id,
        chairId: chairs[1].id,
        start: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
        end: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000),
        status: 'CONFIRMED',
      },
    }),
  ])
  console.log(`✅ ${appointments.length} citas creadas`)

  // Crear entrada en lista de espera
  await prisma.waitlistEntry.create({
    data: {
      clinicId: demoClinic.id,
      patientId: patients[2].id,
      treatmentTypeId: treatmentTypes[4].id,
      preferredTimeSlot: 'AFTERNOON',
      preferredDays: JSON.stringify(['MONDAY', 'WEDNESDAY', 'FRIDAY']),
      urgency: 'NORMAL',
      notes: 'Prefiere horarios después de las 15:00',
    },
  })
  console.log('✅ Entrada en lista de espera creada')

  console.log('\n🎉 Seeding completado!')
  console.log('\n📧 Credenciales de prueba:')
  console.log('   Email: demo@toothmanager.com')
  console.log('   Password: demo123')
  console.log('\n🏥 Clínica demo creada con:')
  console.log(`   - ${staffMembers.length} profesionales`)
  console.log(`   - ${treatmentTypes.length} tipos de tratamiento`)
  console.log(`   - ${chairs.length} sillones`)
  console.log(`   - ${patients.length} pacientes`)
  console.log(`   - ${appointments.length} citas programadas`)
}

main()
  .catch((e) => {
    console.error('❌ Error en seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
