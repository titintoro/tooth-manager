import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
}

async function ensureClinicSlugs() {
  console.log('🔍 Checking clinics for missing slugs...')

  const clinics = await prisma.clinic.findMany({
    where: {
      slug: ''
    }
  })

  if (clinics.length === 0) {
    console.log('✅ All clinics have slugs!')
    return
  }

  console.log(`📝 Found ${clinics.length} clinic(s) without slug`)

  for (const clinic of clinics) {
    let slug = generateSlug(clinic.name)
    let counter = 1

    // Ensure uniqueness
    while (true) {
      const existing = await prisma.clinic.findUnique({
        where: { slug }
      })

      if (!existing || existing.id === clinic.id) {
        break
      }

      slug = `${generateSlug(clinic.name)}-${counter}`
      counter++
    }

    await prisma.clinic.update({
      where: { id: clinic.id },
      data: { slug }
    })

    console.log(`✅ Updated "${clinic.name}" with slug: ${slug}`)
  }

  console.log('🎉 All clinics now have slugs!')
}

ensureClinicSlugs()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
