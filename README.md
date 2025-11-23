# Tooth Manager

Sistema de gestión para clínicas dentales - Optimización de agenda + CRM ligero.

## Stack Tecnológico

- **Next.js 14+** (App Router, TypeScript)
- **Prisma** con PostgreSQL (Supabase)
- **NextAuth** para autenticación
- **Tailwind CSS** + **shadcn/ui**
- **Stripe** (próximamente)

## Instalación

1. Clona el repositorio
2. Instala las dependencias:

```bash
npm install
```

3. Copia el archivo `.env.example` a `.env` y configura tus variables de entorno:

```bash
cp .env.example .env
```

4. Configura tu base de datos PostgreSQL en Supabase y actualiza la `DATABASE_URL` en `.env`

5. Ejecuta las migraciones de Prisma:

```bash
npm run prisma:generate
npm run prisma:migrate
```

6. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## Scripts disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run start` - Inicia el servidor de producción
- `npm run lint` - Ejecuta el linter
- `npm run prisma:generate` - Genera el cliente de Prisma
- `npm run prisma:migrate` - Ejecuta las migraciones de la base de datos
- `npm run prisma:studio` - Abre Prisma Studio para explorar la base de datos
- `npm run prisma:push` - Sincroniza el esquema con la base de datos (desarrollo)

## Estructura del proyecto

```
tooth-manager/
├── app/
│   ├── (marketing)/        # Páginas públicas (landing, login, registro)
│   ├── (app)/              # Aplicación protegida (dashboard, etc.)
│   ├── api/                # API routes
│   ├── layout.tsx          # Layout raíz
│   ├── page.tsx            # Página principal
│   └── globals.css         # Estilos globales
├── components/             # Componentes reutilizables (shadcn/ui)
├── lib/                    # Utilidades y configuraciones
│   ├── auth.ts            # Configuración de NextAuth
│   ├── prisma.ts          # Cliente de Prisma
│   └── utils.ts           # Funciones de utilidad
├── prisma/
│   └── schema.prisma      # Esquema de la base de datos
├── types/                 # Tipos de TypeScript
└── public/                # Archivos estáticos
```

## Próximos pasos

1. Definir el modelo de datos completo para clínicas, pacientes, citas, etc.
2. Implementar la lógica de autenticación con NextAuth
3. Crear los componentes de UI con shadcn/ui
4. Integrar Stripe para pagos y suscripciones
5. Desarrollar las funcionalidades del CRM y la agenda

## Licencia

Privado - Todos los derechos reservados
