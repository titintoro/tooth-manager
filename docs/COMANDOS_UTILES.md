# 🛠️ Comandos Útiles - Tooth Manager

## Desarrollo Diario

### Iniciar el proyecto
```powershell
# 1. Asegurarse de que la base de datos esté corriendo
docker start tooth-manager-db

# 2. Iniciar el servidor de desarrollo
npm run dev
```

### Detener todo
```powershell
# Detener Next.js (Ctrl+C en la terminal)

# Detener base de datos (opcional)
docker stop tooth-manager-db
```

---

## Base de Datos (Prisma)

### Gestión del Schema

```powershell
# Generar cliente Prisma (después de cambios en schema.prisma)
npm run prisma:generate

# Crear y aplicar migración
npm run prisma:migrate
# Te pedirá un nombre descriptivo para la migración

# Push directo sin migración (solo desarrollo)
npm run prisma:push

# Resetear base de datos (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset
```

### Exploración y Datos

```powershell
# Abrir Prisma Studio (explorador visual)
npm run prisma:studio
# Navega a: http://localhost:5555

# Poblar con datos demo
npm run prisma:seed

# Ver migraciones aplicadas
npx prisma migrate status

# Formatear schema.prisma
npx prisma format
```

### Verificación de Conexión

```powershell
# Probar conexión a la base de datos
npx prisma db pull

# Ver info de la base de datos
npx prisma db execute --stdin
# Luego escribe: \dt (para listar tablas en PostgreSQL)
```

---

## Docker (Base de Datos)

### Gestión del Contenedor

```powershell
# Ver estado
docker ps --filter "name=tooth-manager-db"

# Iniciar
docker start tooth-manager-db

# Detener
docker stop tooth-manager-db

# Reiniciar
docker restart tooth-manager-db

# Ver logs en tiempo real
docker logs -f tooth-manager-db

# Ver últimas 100 líneas de logs
docker logs --tail 100 tooth-manager-db

# Estadísticas de uso
docker stats tooth-manager-db
```

### Conectarse a PostgreSQL

```powershell
# Entrar al contenedor
docker exec -it tooth-manager-db psql -U postgres -d tooth_manager

# Comandos útiles dentro de psql:
\dt          # Listar tablas
\d users     # Describir tabla users
\l           # Listar bases de datos
\du          # Listar usuarios
\q           # Salir
```

### Backup y Restore

```powershell
# Crear backup
docker exec tooth-manager-db pg_dump -U postgres tooth_manager > backup.sql

# Restaurar backup
docker exec -i tooth-manager-db psql -U postgres tooth_manager < backup.sql

# Backup comprimido
docker exec tooth-manager-db pg_dump -U postgres tooth_manager | gzip > backup.sql.gz

# Restaurar backup comprimido
gunzip -c backup.sql.gz | docker exec -i tooth-manager-db psql -U postgres tooth_manager
```

### Recrear Contenedor (⚠️ BORRA DATOS)

```powershell
# Detener y eliminar contenedor
docker stop tooth-manager-db
docker rm tooth-manager-db

# Crear nuevo contenedor
docker run --name tooth-manager-db `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=tooth_manager `
  -p 5432:5432 `
  -d postgres:15-alpine

# Esperar 3 segundos y aplicar migraciones
Start-Sleep -Seconds 3
npm run prisma:migrate
npm run prisma:seed
```

---

## Next.js

### Desarrollo

```powershell
# Iniciar servidor de desarrollo
npm run dev

# Iniciar en puerto específico
npx next dev -p 3001

# Iniciar con modo turbo (experimental)
npx next dev --turbo
```

### Build y Producción

```powershell
# Crear build de producción
npm run build

# Iniciar servidor de producción
npm run start

# Analizar bundle
npm install @next/bundle-analyzer
# Luego en next.config.js agregar configuración
```

### Linting y Type Checking

```powershell
# Ejecutar ESLint
npm run lint

# Fix automático de errores
npm run lint -- --fix

# Type checking manual
npx tsc --noEmit
```

### Caché y Limpieza

```powershell
# Limpiar caché de Next.js
Remove-Item -Recurse -Force .next

# Limpiar caché de Next.js y node_modules
Remove-Item -Recurse -Force .next, node_modules

# Reinstalar dependencias desde cero
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

---

## Git (Control de Versiones)

### Comandos Básicos

```powershell
# Ver estado
git status

# Ver cambios
git diff

# Agregar archivos
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Ver historial
git log --oneline --graph --decorate --all
```

### Branches

```powershell
# Crear y cambiar a nueva rama
git checkout -b feature/nombre-feature

# Cambiar de rama
git checkout main

# Listar ramas
git branch -a

# Mergear rama
git checkout main
git merge feature/nombre-feature

# Eliminar rama
git branch -d feature/nombre-feature
```

### Stash (Guardar cambios temporales)

```powershell
# Guardar cambios
git stash

# Ver stash guardados
git stash list

# Aplicar último stash
git stash pop

# Aplicar stash específico
git stash apply stash@{0}
```

---

## NPM

### Gestión de Dependencias

```powershell
# Instalar dependencias
npm install

# Instalar dependencia específica
npm install nombre-paquete

# Instalar como dev dependency
npm install -D nombre-paquete

# Actualizar dependencias
npm update

# Ver dependencias desactualizadas
npm outdated

# Actualizar dependencia específica
npm install nombre-paquete@latest

# Eliminar dependencia
npm uninstall nombre-paquete
```

### Auditoría de Seguridad

```powershell
# Ver vulnerabilidades
npm audit

# Fix automático (versiones compatibles)
npm audit fix

# Fix forzado (puede romper cosas)
npm audit fix --force

# Ver detalles de vulnerabilidad
npm audit --json
```

---

## shadcn/ui

### Agregar Componentes

```powershell
# Ver componentes disponibles
npx shadcn-ui@latest add

# Agregar componente específico
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add select
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add toast

# Agregar múltiples componentes
npx shadcn-ui@latest add button input card dialog
```

---

## Debugging

### Logs de Base de Datos

```powershell
# Ver queries de Prisma en consola
# Agregar a .env:
# DATABASE_URL="postgresql://...?connection_limit=5"
# DEBUG="prisma:query"

# O iniciar con:
$env:DEBUG="prisma:query"; npm run dev
```

### Verificar Puertos

```powershell
# Ver qué proceso usa un puerto
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5432"

# Matar proceso por PID
Stop-Process -Id <PID> -Force
```

### Variables de Entorno

```powershell
# Ver variables en PowerShell
Get-ChildItem Env:

# Ver variable específica
$env:DATABASE_URL

# Establecer variable temporal
$env:NODE_ENV="development"
```

---

## Productividad

### Aliases Útiles (PowerShell Profile)

```powershell
# Editar perfil de PowerShell
notepad $PROFILE

# Agregar estos aliases:
function dev { npm run dev }
function build { npm run build }
function studio { npm run prisma:studio }
function migrate { npm run prisma:migrate }
function seed { npm run prisma:seed }
function dbu { docker start tooth-manager-db }
function dbd { docker stop tooth-manager-db }
function dbl { docker logs -f tooth-manager-db }

# Recargar perfil
. $PROFILE
```

### VS Code Tasks (tasks.json)

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Server",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Start Database",
      "type": "shell",
      "command": "docker start tooth-manager-db",
      "problemMatcher": []
    },
    {
      "label": "Prisma Studio",
      "type": "npm",
      "script": "prisma:studio",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

---

## Troubleshooting Común

### "Port 3000 already in use"
```powershell
netstat -ano | findstr ":3000"
Stop-Process -Id <PID>
npm run dev
```

### "Cannot connect to database"
```powershell
docker start tooth-manager-db
Start-Sleep -Seconds 3
npm run dev
```

### "Prisma Client not generated"
```powershell
npm run prisma:generate
npm run dev
```

### "Migration failed"
```powershell
npx prisma migrate reset
npm run prisma:migrate
npm run prisma:seed
```

### "Module not found"
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### ESLint/TypeScript errors después de cambios
```powershell
Remove-Item -Recurse -Force .next
npm run dev
```

---

## Recursos Externos

### Documentación
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth: https://next-auth.js.org
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- PostgreSQL: https://www.postgresql.org/docs

### Herramientas Online
- Prisma Schema Visualizer: https://prismaliser.app
- Regex Tester: https://regex101.com
- JSON Formatter: https://jsonformatter.org
- SQL Formatter: https://sqlformat.org

---

**Pro Tip:** Guarda este archivo en tu barra de marcadores para acceso rápido durante el desarrollo.
