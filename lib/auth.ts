import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Buscar usuario por email
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            clinicMemberships: {
              where: { isActive: true },
              include: {
                clinic: true,
              },
            },
          },
        })

        if (!user || !user.password) {
          return null
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        // Retornar usuario con sus clínicas
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // En el login inicial, agregar info del usuario
      if (user) {
        token.id = user.id
        
        // Obtener clínicas del usuario
        const userWithClinics = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            clinicMemberships: {
              where: { isActive: true },
              include: {
                clinic: true,
              },
              orderBy: {
                joinedAt: 'asc', // La primera clínica a la que se unió
              },
            },
          },
        })

        if (userWithClinics && userWithClinics.clinicMemberships.length > 0) {
          // Usar la primera clínica como default
          const firstMembership = userWithClinics.clinicMemberships[0]
          token.currentClinicId = firstMembership.clinicId
          token.role = firstMembership.role
          token.clinicIds = userWithClinics.clinicMemberships.map(m => m.clinicId)
        }
      }

      // Permitir actualización del currentClinicId desde el cliente
      if (trigger === 'update' && session?.currentClinicId) {
        token.currentClinicId = session.currentClinicId
        
        // Actualizar el rol para la nueva clínica
        const membership = await prisma.userClinicMembership.findUnique({
          where: {
            userId_clinicId: {
              userId: token.id as string,
              clinicId: session.currentClinicId,
            },
          },
        })
        
        if (membership) {
          token.role = membership.role
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.currentClinicId = token.currentClinicId as string | undefined
        session.user.role = token.role as UserRole | undefined
        session.user.clinicIds = token.clinicIds as string[] | undefined
      }
      return session
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      // Log de inicio de sesión
      console.log(`User ${user.email} signed in${isNewUser ? ' (new user)' : ''}`)
    },
  },
  debug: process.env.NODE_ENV === 'development',
}
