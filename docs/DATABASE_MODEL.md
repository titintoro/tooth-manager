# Modelo de Datos - Tooth Manager

## Resumen Ejecutivo

Sistema multi-tenant para clínicas dentales con los siguientes módulos principales:
- **Autenticación y Usuarios** (NextAuth compatible)
- **Multi-tenancy** (cada clínica es un tenant independiente)
- **Gestión de Personal**
- **Agenda y Citas**
- **Lista de Espera**
- **Notificaciones**
- **Suscripciones (Stripe)**

---

## 📊 Diagrama de Relaciones

```
User (NextAuth)
  ├── Account (OAuth)
  ├── Session
  ├── UserClinicMembership → Clinic
  └── StaffMember → Clinic

Clinic (Tenant)
  ├── UserClinicMembership → User
  ├── StaffMember → User (opcional)
  ├── TreatmentType
  ├── Chair
  ├── Patient
  ├── Appointment
  ├── WaitlistEntry
  ├── NotificationLog
  └── ClinicSubscription (Stripe)

Appointment
  ├── Patient
  ├── TreatmentType
  ├── StaffMember
  ├── Chair
  └── Clinic
```

---

## 🔐 Autenticación y Usuarios

### User
**Propósito:** Usuario del sistema, compatible con NextAuth + PrismaAdapter

**Campos principales:**
- `id`, `name`, `email`, `emailVerified`, `image`, `password`
- Relaciones: `accounts`, `sessions`, `clinicMemberships`, `staffMembers`

**Uso:** Un usuario puede:
- Pertenecer a múltiples clínicas con diferentes roles
- Ser staff member (profesional) en una o varias clínicas
- Autenticarse vía credentials o OAuth

### Account
**Propósito:** Cuentas OAuth (Google, Facebook, etc.) asociadas al usuario

### Session
**Propósito:** Sesiones activas del usuario para NextAuth

### VerificationToken
**Propósito:** Tokens para verificación de email y reset de contraseña

---

## 🏥 Multi-tenancy y Clínicas

### Clinic
**Propósito:** Clínica dental - Tenant principal del sistema

**Campos principales:**
- Información básica: `name`, `slug`, `email`, `phone`, `address`, `city`, `country`
- Configuración: `timezone`, `businessHoursStart`, `businessHoursEnd`, `slotDuration`
- Estado: `isActive`

**Scoping:** Todas las entidades operativas están vinculadas a una clínica mediante `clinicId`

### UserClinicMembership
**Propósito:** Relación muchos-a-muchos entre usuarios y clínicas con rol asignado

**Roles disponibles:**
- `OWNER` - Propietario (acceso total)
- `ADMIN` - Administrador (gestión operativa)
- `DOCTOR` - Doctor (ve su agenda y pacientes)
- `RECEPTIONIST` - Recepcionista (gestión de agenda)

**Unicidad:** Un usuario solo puede tener un rol por clínica

---

## 👨‍⚕️ Personal y Profesionales

### StaffMember
**Propósito:** Miembro del personal (dentistas, higienistas, etc.)

**Características:**
- Puede estar ligado a un `User` (opcional)
- Permite personal sin acceso al sistema
- Campos: `firstName`, `lastName`, `profession`, `licenseNumber`
- Configuración: `isActive`, `canBookAppointments`, `color` (para calendario)

**Uso:** 
- Un StaffMember ligado a un User puede iniciar sesión
- Un StaffMember sin User es solo referencia para agendamiento

---

## 💊 Tratamientos y Recursos

### TreatmentType
**Propósito:** Catálogo de servicios/tratamientos que ofrece la clínica

**Campos:**
- `name`, `description`, `code` (para facturación)
- `defaultDuration` (minutos)
- `estimatedPrice`, `currency`
- `color` (visualización en calendario)

### Chair
**Propósito:** Sillones/boxes/consultorios disponibles

**Campos:**
- `name` (ej: "Sillón 1", "Box A")
- `location` (ej: "Planta baja")
- `displayOrder` (orden de visualización)

---

## 👤 Pacientes

### Patient
**Propósito:** Paciente de la clínica - Solo datos administrativos

**⚠️ Importante:** NO almacenamos historia clínica ni información médica sensible

**Campos:**
- Identificación: `firstName`, `lastName`, `dateOfBirth`
- Contacto: `email`, `phone`, `address`, `city`
- Administrativo: `notes` (notas no clínicas)

**Scoping:** `clinicId` - Los pacientes pertenecen a una clínica específica

**Índices:**
- Por clínica y email
- Por clínica y teléfono

---

## 📅 Agenda y Citas

### Appointment
**Propósito:** Cita agendada

**Campos principales:**
- Referencias: `patientId`, `clinicId`, `treatmentTypeId`, `staffMemberId`, `chairId`
- Tiempo: `start`, `end`
- Estado: `status` (ver enum AppointmentStatus)
- Notas: `notes` (visibles), `privateNotes` (solo staff)
- Recordatorios: `reminderSentAt`
- Cancelación: `cancelledAt`, `cancelReason`

**Estados disponibles (AppointmentStatus):**
- `SCHEDULED` - Programada
- `CONFIRMED` - Confirmada por el paciente
- `COMPLETED` - Completada
- `CANCELLED` - Cancelada
- `NO_SHOW` - Paciente no se presentó

**Índices de performance:**
- `(clinicId, start, end)` - Consultas de calendario
- `(clinicId, status, start)` - Filtros por estado
- `(patientId, start)` - Historia del paciente
- `(staffMemberId, start)` - Agenda del profesional

---

## ⏳ Lista de Espera

### WaitlistEntry
**Propósito:** Pacientes en espera de disponibilidad de citas

**Campos:**
- Referencias: `patientId`, `clinicId`, `treatmentTypeId`
- Preferencias: 
  - `preferredTimeSlot` (ej: "MORNING", "AFTERNOON")
  - `preferredDays` (JSON: ["MONDAY", "WEDNESDAY"])
  - `urgency` (LOW, NORMAL, HIGH, URGENT)
- Estado: `status` (ver enum WaitlistStatus)
- Seguimiento: `notifiedAt`, `resolvedAt`

**Estados (WaitlistStatus):**
- `WAITING` - En espera
- `NOTIFIED` - Notificado de disponibilidad
- `SCHEDULED` - Ya se le asignó cita
- `CANCELLED` - Cancelado por el paciente
- `EXPIRED` - Solicitud expirada

**Uso:**
- Cuando hay cancelaciones, se puede notificar a pacientes en lista de espera
- Se priorizan por urgencia y fecha de registro

---

## 📧 Notificaciones

### NotificationLog
**Propósito:** Registro de todas las comunicaciones enviadas

**Campos:**
- Destinatario: `recipientEmail`, `recipientPhone`, `recipientName`
- Tipo: `type` (ver enum NotificationType)
- Canal: `channel` (EMAIL, SMS, WHATSAPP, PUSH)
- Contenido: `subject`, `content`
- Estado: `status` (PENDING, SENT, DELIVERED, FAILED, BOUNCED)
- Timestamps: `sentAt`, `failedAt`
- `metadata` (JSON con info adicional)

**Tipos de notificación:**
- `APPOINTMENT_REMINDER` - Recordatorio de cita
- `APPOINTMENT_CONFIRMATION` - Confirmación de cita
- `APPOINTMENT_CANCELLED` - Notificación de cancelación
- `WAITLIST_NOTIFICATION` - Disponibilidad en lista de espera
- `GENERAL` - Comunicación general

**Uso:**
- Auditoría de comunicaciones
- Reenvío en caso de fallo
- Análisis de efectividad de recordatorios

---

## 💳 Suscripciones (Stripe)

### ClinicSubscription
**Propósito:** Gestión de suscripción y pagos de la clínica

**Integración Stripe:**
- `stripeCustomerId` - ID del customer en Stripe
- `stripeSubscriptionId` - ID de la suscripción
- `stripePriceId` - ID del precio/plan

**Campos de control:**
- `plan` (TRIAL, BASIC, STANDARD, PREMIUM, ENTERPRISE)
- `status` (TRIALING, ACTIVE, PAST_DUE, CANCELED, etc.)
- Períodos: `currentPeriodStart`, `currentPeriodEnd`, `trialEndsAt`
- Cancelación: `cancelAt`, `canceledAt`
- Límites: `maxStaffMembers`, `maxAppointmentsMonth`

**Estados de suscripción:**
- `TRIALING` - En período de prueba
- `ACTIVE` - Activa y al día
- `PAST_DUE` - Pago atrasado
- `CANCELED` - Cancelada
- `UNPAID` - Sin pagar
- `INCOMPLETE` - Pago incompleto
- `INCOMPLETE_EXPIRED` - Expiró antes de completarse

**Uso:**
- Controlar acceso a funcionalidades según plan
- Webhooks de Stripe actualizan estos datos
- Restricciones de límites (staff, citas, etc.)

---

## 🔄 Flujos Principales

### 1. Onboarding de Clínica
```
1. Usuario se registra → User creado
2. Crea su clínica → Clinic creado
3. Se crea UserClinicMembership con rol OWNER
4. Se crea ClinicSubscription en estado TRIAL
5. Usuario configura: StaffMembers, Chairs, TreatmentTypes
```

### 2. Agendamiento de Cita
```
1. Buscar/crear Patient
2. Seleccionar TreatmentType (determina duración)
3. Buscar disponibilidad (StaffMember, Chair, horario)
4. Crear Appointment con status SCHEDULED
5. Enviar NotificationLog (confirmación)
```

### 3. Lista de Espera
```
1. Paciente solicita cita pero no hay disponibilidad
2. Crear WaitlistEntry con preferencias
3. Cuando hay cancelación:
   - Buscar WaitlistEntry matching
   - Crear NotificationLog de tipo WAITLIST_NOTIFICATION
   - Actualizar status a NOTIFIED
4. Si paciente acepta → crear Appointment, status → SCHEDULED
```

### 4. Recordatorios Automáticos
```
1. Job diario busca Appointments próximas sin reminder
2. Para cada cita:
   - Crear NotificationLog (tipo APPOINTMENT_REMINDER)
   - Actualizar reminderSentAt en Appointment
3. Monitorear NotificationStatus para reintentos
```

---

## 🔒 Seguridad Multi-tenant

### Principios de Scoping

**Todas las queries deben filtrar por clinicId:**
```typescript
// ✅ Correcto
const patients = await prisma.patient.findMany({
  where: { clinicId: currentClinicId }
})

// ❌ Incorrecto (expone datos de otras clínicas)
const patients = await prisma.patient.findMany()
```

### Middleware de Autorización
Siempre verificar:
1. Usuario tiene UserClinicMembership activa
2. Rol del usuario permite la acción
3. Recurso solicitado pertenece a la clínica del usuario

---

## 📊 Índices de Performance

### Índices Críticos Implementados

**Appointments:**
- `(clinicId, start, end)` - Vistas de calendario
- `(clinicId, status, start)` - Filtros por estado
- `(patientId, start)` - Historia del paciente
- `(staffMemberId, start)` - Agenda del profesional

**Patients:**
- `(clinicId, email)` - Búsqueda por email
- `(clinicId, phone)` - Búsqueda por teléfono
- `(clinicId, isActive)` - Pacientes activos

**WaitlistEntries:**
- `(clinicId, status, createdAt)` - Priorización de espera

**NotificationLogs:**
- `(clinicId, createdAt)` - Auditoría temporal
- `(clinicId, status)` - Pendientes de envío

---

## 🚀 Próximos Pasos

### Para implementar funcionalidades:

1. **Crear servicios de dominio:**
   - `AppointmentService` - CRUD + validaciones de conflictos
   - `WaitlistService` - Matching y notificaciones
   - `NotificationService` - Envío de emails/SMS
   - `SubscriptionService` - Integración con Stripe

2. **Middleware de autorización:**
   - Verificar `UserClinicMembership` y roles
   - Scope automático por `clinicId`

3. **Validaciones de negocio:**
   - Evitar double-booking (mismo staff, misma hora)
   - Verificar límites de suscripción
   - Horarios dentro de business hours

4. **Webhooks de Stripe:**
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

---

## 📝 Notas Importantes

- ✅ Schema compatible con NextAuth + PrismaAdapter
- ✅ Multi-tenancy lógico mediante `clinicId`
- ✅ NO almacenamos información clínica sensible
- ✅ Índices optimizados para queries frecuentes
- ✅ Enums tipados para estados y roles
- ✅ Relaciones con DELETE CASCADE apropiadas
- ✅ Campos de auditoría (`createdAt`, `updatedAt`)
- ✅ Soft deletes mediante `isActive` donde aplica

---

**Migración aplicada:** `20251123151113_add_complete_schema`  
**Base de datos:** PostgreSQL en Docker (`tooth_manager`)  
**Prisma Studio:** http://localhost:5555
