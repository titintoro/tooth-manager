# Configuración de Base de Datos

## ⚠️ IMPORTANTE: Configurar DATABASE_URL

Actualmente el archivo `.env` está configurado para una base de datos PostgreSQL local.

### Opción 1: Usar Supabase (Recomendado para este proyecto)

1. Ve a https://app.supabase.com
2. Crea un nuevo proyecto (o usa uno existente)
3. Ve a Settings > Database
4. En "Connection string" > "URI", copia la cadena de conexión
5. Reemplaza `[YOUR-PASSWORD]` con tu contraseña real
6. Actualiza el archivo `.env`:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

O usa la conexión directa (sin pooler):

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Opción 2: Usar PostgreSQL local

Si tienes PostgreSQL instalado localmente:

```env
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/tooth_manager?schema=public"
```

Luego crea la base de datos:

```powershell
# Si tienes psql instalado:
createdb tooth_manager

# O conéctate y créala:
psql -U postgres
CREATE DATABASE tooth_manager;
\q
```

### Opción 3: Usar Docker (Rápido para desarrollo)

```powershell
# Ejecuta un contenedor de PostgreSQL:
docker run --name tooth-manager-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tooth_manager -p 5432:5432 -d postgres:15

# Luego usa esta URL en .env:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tooth_manager?schema=public"
```

## Después de configurar la DATABASE_URL

Ejecuta:

```powershell
npm run prisma:generate
npm run prisma:migrate
```

## Verificar conexión

```powershell
# Prueba la conexión con Prisma Studio:
npm run prisma:studio
```

Si abre correctamente en http://localhost:5555, tu conexión está funcionando.
