# Instrucciones de Instalación - Tooth Manager

## Pasos para poner en marcha el proyecto

### 1. Instalar dependencias

Abre PowerShell en el directorio del proyecto y ejecuta:

```powershell
npm install
```

Este comando instalará todas las dependencias necesarias:
- Next.js 14 con React 18
- TypeScript y ESLint
- Tailwind CSS y PostCSS
- shadcn/ui (class-variance-authority, clsx, tailwind-merge, tailwindcss-animate)
- @radix-ui/react-slot (para componentes shadcn/ui)
- Prisma Client y CLI
- NextAuth.js para autenticación
- bcryptjs para hash de contraseñas
- Zod para validación de esquemas

### 2. Configurar variables de entorno

Edita el archivo `.env` y actualiza las siguientes variables:

```env
# Obtén esta URL de tu proyecto en Supabase
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# Para desarrollo local, mantén esta URL
NEXTAUTH_URL="http://localhost:3000"

# Genera un secreto aleatorio para producción
# Puedes usar: openssl rand -base64 32
NEXTAUTH_SECRET="tu-secreto-super-secreto-cambiame-en-produccion"

NODE_ENV="development"
```

**Cómo obtener DATABASE_URL de Supabase:**
1. Ve a tu proyecto en Supabase (https://app.supabase.com)
2. Ve a Settings > Database
3. En "Connection string" selecciona "URI" o "Connection pooling"
4. Copia la URL y reemplaza `[YOUR-PASSWORD]` con tu contraseña real

### 3. Generar el cliente de Prisma

```powershell
npm run prisma:generate
```

Esto generará el cliente de Prisma basado en el esquema en `prisma/schema.prisma`.

### 4. Crear la base de datos y ejecutar migraciones

```powershell
npm run prisma:migrate
```

Se te pedirá un nombre para la migración. Puedes usar algo como "init" o "initial_setup".

**Nota:** Este comando creará las tablas en tu base de datos PostgreSQL en Supabase.

### 5. (Opcional) Explorar la base de datos con Prisma Studio

```powershell
npm run prisma:studio
```

Esto abrirá una interfaz visual en http://localhost:5555 donde puedes ver y editar los datos de tu base de datos.

### 6. Iniciar el servidor de desarrollo

```powershell
npm run dev
```

El proyecto estará disponible en: http://localhost:3000

## Resumen de comandos

```powershell
# Instalación completa (ejecutar en orden)
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Próximos pasos después de la instalación

1. **Definir el modelo de datos completo** en `prisma/schema.prisma`
   - Clínicas (Clinic)
   - Pacientes (Patient)
   - Citas (Appointment)
   - Usuarios (User) - ya hay uno básico
   - Dentistas/Profesionales (Dentist)
   - Tratamientos (Treatment)
   - etc.

2. **Implementar la autenticación**
   - Completar la lógica en `lib/auth.ts`
   - Crear formularios de login/registro
   - Configurar middleware de protección de rutas

3. **Instalar componentes adicionales de shadcn/ui**
   ```powershell
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add calendar
   npx shadcn-ui@latest add dialog
   # etc.
   ```

4. **Desarrollar las funcionalidades principales**
   - Sistema de agenda/calendario
   - Gestión de pacientes (CRM ligero)
   - Dashboard con KPIs
   - Integración con PMS existentes

## Estructura del Proyecto Creada

```
tooth-manager/
├── app/
│   ├── (marketing)/              # Grupo de rutas públicas
│   │   ├── page.tsx             # Landing page
│   │   ├── login/page.tsx       # Página de login
│   │   ├── register/page.tsx    # Página de registro
│   │   └── layout.tsx           # Layout para páginas públicas
│   ├── (app)/                   # Grupo de rutas protegidas
│   │   ├── dashboard/page.tsx   # Dashboard principal
│   │   └── layout.tsx           # Layout con sidebar/nav
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts  # API de autenticación
│   ├── layout.tsx               # Layout raíz
│   ├── page.tsx                 # Redirect a dashboard
│   └── globals.css              # Estilos globales con Tailwind
├── components/
│   └── ui/                      # Componentes de shadcn/ui
│       ├── button.tsx
│       ├── input.tsx
│       └── card.tsx
├── lib/
│   ├── auth.ts                  # Configuración de NextAuth
│   ├── prisma.ts                # Cliente de Prisma
│   └── utils.ts                 # Utilidades (cn helper)
├── prisma/
│   └── schema.prisma            # Esquema de base de datos
├── types/
│   └── next-auth.d.ts          # Tipos extendidos de NextAuth
├── .env                         # Variables de entorno (NO subir a Git)
├── .env.example                 # Plantilla de variables de entorno
├── .gitignore                   # Archivos ignorados por Git
├── components.json              # Configuración de shadcn/ui
├── next.config.js               # Configuración de Next.js
├── package.json                 # Dependencias y scripts
├── postcss.config.js            # Configuración de PostCSS
├── tailwind.config.ts           # Configuración de Tailwind
└── tsconfig.json                # Configuración de TypeScript
```

## Troubleshooting

### Si Prisma no puede conectarse a la base de datos:
- Verifica que la DATABASE_URL esté correctamente configurada
- Asegúrate de que tu proyecto Supabase esté activo
- Verifica que no haya firewall bloqueando la conexión

### Si hay errores de TypeScript:
- Ejecuta `npm install` para asegurar que todas las dependencias estén instaladas
- Reinicia el servidor de desarrollo

### Si Tailwind CSS no funciona:
- Verifica que `tailwind.config.ts` y `postcss.config.js` estén en la raíz
- Asegúrate de que `globals.css` esté importado en el layout raíz

## Notas Importantes

- **NO** subas el archivo `.env` a Git (ya está en `.gitignore`)
- Genera un `NEXTAUTH_SECRET` seguro para producción
- El modelo de datos actual es solo un ejemplo, deberás expandirlo
- NextAuth está configurado pero sin proveedor funcional aún
- Stripe NO está incluido todavía (como solicitaste)

## Contacto y Ayuda

Si tienes problemas con la instalación, revisa:
- Documentación de Next.js: https://nextjs.org/docs
- Documentación de Prisma: https://www.prisma.io/docs
- Documentación de NextAuth: https://next-auth.js.org
- Documentación de shadcn/ui: https://ui.shadcn.com
