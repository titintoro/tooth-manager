# Widget de Reserva Online

## Descripción General

Sistema de reserva pública que permite a los pacientes agendar citas directamente sin necesidad de autenticación. Cada clínica tiene su propia URL única basada en su `slug`.

## URL del Widget

```
https://tu-dominio.com/book/[clinicSlug]
```

Ejemplo: `https://tu-dominio.com/book/clinica-dental-centro`

## Flujo de Reserva

### 1. Selección de Tratamiento
- Se muestran todos los tratamientos activos de la clínica
- Cada tratamiento muestra:
  - Nombre y descripción
  - Duración estimada
  - Color identificativo

### 2. Selección de Profesional
- Opciones disponibles:
  - "Cualquier profesional disponible" (sin preferencia)
  - Lista de profesionales activos que pueden recibir citas
- Muestra nombre, profesión y color identificativo

### 3. Selección de Fecha y Hora
- **Calendario**: Permite seleccionar fecha futura
- **Slots Disponibles**: 
  - Se calculan en tiempo real según:
    - Horario de apertura de la clínica
    - Duración del tratamiento seleccionado
    - Disponibilidad de sillones
    - Disponibilidad del profesional (si se seleccionó uno específico)
  - Slots cada 15 minutos
  - Solo se muestran horarios completamente libres

### 4. Datos del Paciente
- **Campos obligatorios**:
  - Nombre
  - Apellidos
- **Campos opcionales**:
  - Email
  - Teléfono
  - Notas adicionales
- **Resumen de la reserva**: Muestra tratamiento, profesional, fecha y hora

### 5. Confirmación
- Pantalla de éxito con todos los detalles
- Opción para reservar otra cita

## Lógica de Citas

### Creación de Paciente
- Si existe un paciente con el mismo email o teléfono, se reutiliza
- Si no existe, se crea un nuevo registro

### Creación de Cita
- Estado inicial: `SCHEDULED`
- Se asigna automáticamente un sillón disponible
- Se valida que no haya conflictos de horario

### Validación de Disponibilidad

#### Algoritmo de Slots Disponibles:
1. Genera slots cada 15 minutos entre horario de apertura y cierre
2. Para cada slot:
   - Verifica disponibilidad de al menos un sillón
   - Si hay profesional seleccionado, verifica su disponibilidad
   - Considera la duración completa del tratamiento
   - Solo marca como disponible si TODO el período está libre

#### Validación de Sillones:
- Cada sillón puede tener máximo una cita por slot de tiempo
- Se revisan citas con estado `SCHEDULED` o `CONFIRMED`

#### Validación de Profesionales:
- Si se selecciona un profesional específico, se valida que no tenga citas solapadas
- Si se elige "cualquiera", solo importa la disponibilidad de sillones

## Archivos Implementados

### Server Actions
- `app/book/[clinicSlug]/actions.ts`
  - `getClinicBySlug()`: Obtiene información pública de la clínica
  - `getActiveTreatmentTypes()`: Lista tratamientos activos
  - `getActiveStaffMembers()`: Lista profesionales activos
  - `getAvailableSlots()`: Calcula slots disponibles
  - `createPublicAppointment()`: Crea cita y paciente
  - `findAvailableChair()`: Encuentra sillón libre (helper)

### Componentes
- `app/book/[clinicSlug]/page.tsx`: Página principal con header de clínica
- `app/book/[clinicSlug]/booking-widget.tsx`: Widget principal con flujo completo
- `app/book/layout.tsx`: Layout sin autenticación

### Configuración
- `middleware.ts`: Actualizado para permitir ruta `/book` sin autenticación

## Integración con Agenda Interna

Las citas creadas públicamente:
- Se sincronizan automáticamente con la agenda interna (`/agenda`)
- Son visibles para staff autenticado
- Pueden ser gestionadas (confirmar, completar, cancelar, etc.)
- Se validan contra la disponibilidad real

## Uso como iFrame

El widget puede embeberse en una página externa:

```html
<iframe 
  src="https://tu-dominio.com/book/clinica-dental-centro" 
  width="100%" 
  height="800px"
  frameborder="0"
  title="Reserva de citas"
></iframe>
```

### Estilos del iFrame
- Diseño responsivo con gradiente azul
- Tarjeta blanca centrada con sombra
- Header con información de la clínica
- Indicador de progreso paso a paso
- Botones y formularios estilizados

## Consideraciones de Seguridad

- ✅ No requiere autenticación (acceso público)
- ✅ Validaciones en el servidor (no confiamos en el cliente)
- ✅ Prevención de overbooking mediante validación de slots
- ✅ Rate limiting recomendado (no implementado aún)
- ✅ Datos mínimos requeridos del paciente

## Mejoras Futuras

- [ ] Email de confirmación automático
- [ ] SMS de confirmación/recordatorio
- [ ] Integración con Google Calendar
- [ ] Cancelación pública de citas (con token)
- [ ] Lista de espera desde widget público
- [ ] Múltiples idiomas
- [ ] Personalización de colores por clínica
- [ ] Analytics de conversión
- [ ] Captcha para prevenir spam
- [ ] Rate limiting por IP

## Script de Mantenimiento

**Generar slugs para clínicas existentes:**

```bash
npx ts-node scripts/ensure-clinic-slugs.ts
```

Este script:
- Busca clínicas sin slug
- Genera slugs únicos basados en el nombre
- Elimina caracteres especiales y acentos
- Asegura unicidad agregando números si es necesario

## Testing Manual

1. **Crear clínica de prueba** con slug único
2. **Añadir tratamientos** activos con duraciones variadas
3. **Añadir profesionales** activos
4. **Configurar sillones** activos
5. **Visitar** `/book/[slug-de-tu-clinica]`
6. **Probar flujo completo**:
   - Seleccionar tratamiento
   - Seleccionar profesional (o "cualquiera")
   - Verificar que slots mostrados sean correctos
   - Completar formulario
   - Verificar confirmación
7. **Verificar en agenda** que la cita aparece correctamente

## Datos de Ejemplo

Para testing, puedes insertar datos directamente:

```sql
-- Actualizar slug de una clínica existente
UPDATE clinics SET slug = 'clinica-demo' WHERE id = 'tu-clinic-id';

-- Verificar configuración
SELECT name, slug, "businessHoursStart", "businessHoursEnd", "slotDuration" 
FROM clinics WHERE slug = 'clinica-demo';
```

## Monitoreo

Recomendaciones para producción:
- Log de citas creadas públicamente
- Métricas de conversión (visitas → citas)
- Tracking de slots más populares
- Alertas de errores en creación de citas
