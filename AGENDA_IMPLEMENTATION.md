# Agenda/Calendar System Implementation

## Overview
Complete implementation of the internal clinic calendar/agenda system as the core product feature. This allows managing appointments with weekly views, overlap validation, status tracking, and drag & drop rescheduling.

## Features Implemented

### 1. Server Actions (`app/(app)/agenda/actions.ts`)
Complete CRUD operations with validation:

- **getAppointments()**: Fetch appointments for a date range, filtering by clinic and excluding cancelled appointments
- **getResources()**: Retrieve available chairs and staff members for the clinic
- **createAppointment()**: Create new appointments with comprehensive overlap validation
  - Validates chair availability (no overlapping appointments on the same chair)
  - Validates staff member availability (no overlapping appointments for the same professional)
  - Only checks SCHEDULED and CONFIRMED appointments for overlaps
- **updateAppointment()**: Update appointment details (reschedule, change duration, reassign resources)
  - Recalculates end time based on start + duration
  - Validates overlaps excluding the current appointment
- **updateAppointmentStatus()**: Change appointment status (SCHEDULED → CONFIRMED → COMPLETED, or NO_SHOW, CANCELLED)
- **deleteAppointment()**: Soft delete appointments
- **getAppointmentFormData()**: Load all necessary data for the appointment creation form

### 2. Weekly Calendar View (`app/(app)/agenda/page.tsx`)
Server component that:
- Parses date and view mode from URL search params
- Fetches appointments and resources for the current week
- Passes data to the client WeeklyCalendar component

### 3. Calendar Navigation (`app/(app)/agenda/weekly-calendar.tsx`)
Client component with:
- **Week Navigation**: Previous/Next week buttons with date display
- **Today Button**: Quick navigation to current week
- **View Toggle**: Switch between "Por Sillón" (by chair) and "Por Profesional" (by staff)
- **New Appointment Button**: Opens creation dialog
- **Drag & Drop Handler**: Processes dropped appointments and updates them via server action

### 4. Calendar Grid (`app/(app)/agenda/calendar-grid.tsx`)
Renders the weekly calendar grid with:
- **Time Slots**: 15-minute intervals from 8:00 AM to 10:00 PM (56 slots)
- **Resource Columns**: Dynamic columns for chairs or staff members
- **Appointment Cards**: Positioned within the grid based on start/end times
- **Drop Zones**: Each slot accepts dropped appointments for rescheduling
- **Visual Feedback**: Highlights drop targets with blue background

### 5. Appointment Card (`app/(app)/agenda/appointment-card.tsx`)
Visual representation of appointments:
- **Draggable**: Can be dragged to reschedule
- **Status Colors**: 
  - Blue: SCHEDULED
  - Green: CONFIRMED
  - Gray: COMPLETED
  - Red: CANCELLED
  - Orange: NO_SHOW
- **Treatment Color**: Border color from treatment type
- **Information Displayed**: Patient name, treatment, time range, staff member
- **Click Handler**: Opens appointment details dialog

### 6. Create Appointment Dialog (`app/(app)/agenda/create-appointment-dialog.tsx`)
Form for creating new appointments:
- **Patient Selection**: Searchable dropdown
- **Treatment Selection**: Auto-fills default duration
- **Staff Member Selection**: Optional
- **Chair Selection**: Optional
- **Date & Time**: Separate date picker and time input
- **Duration**: In minutes, pre-filled from treatment
- **Notes**: Optional text area
- **Pre-selection**: Supports initial slot selection from grid click

### 7. Appointment Details Dialog (`app/(app)/agenda/appointment-details-dialog.tsx`)
View and manage existing appointments:
- **Status Change Buttons**: Confirm, Complete, No Show, Cancel
- **Delete Button**: With confirmation dialog
- **Appointment Information**: Patient, treatment, time, staff, chair, notes

## Technical Details

### Time Slot System
- **Granularity**: 15-minute slots
- **Range**: 8:00 AM to 10:00 PM (14 hours = 56 slots)
- **Positioning**: Appointments calculate `topPercent` and `heightPercent` based on slot divisions

### Overlap Validation
Uses complex Prisma queries with OR conditions:
```typescript
OR: [
  { AND: [{ start: { lte: start } }, { end: { gt: start } }] }, // New start overlaps existing
  { AND: [{ start: { lt: end } }, { end: { gte: end } }] },     // New end overlaps existing
  { AND: [{ start: { gte: start } }, { end: { lte: end } }] }   // Existing fully inside new
]
```

### Resource Type Handling
Uses TypeScript type guards to distinguish between chairs and staff:
```typescript
type CombinedResource = 
  | { id: string; name: string; ... }          // Chair
  | { id: string; firstName: string; ... }     // Staff Member

// In render:
'name' in resource ? resource.name : `${resource.firstName} ${resource.lastName}`
```

### Drag & Drop Implementation
- **Drag Start**: Stores appointment ID in dataTransfer
- **Drag Over**: Highlights target slot
- **Drop**: Calculates new start time from slot, preserves duration, updates via server action
- **View-Aware**: Moves to new chair in chair view, or new staff member in staff view

## Authentication & Authorization
All server actions protected with:
- `getAuthorizedSession()` requiring roles: OWNER, ADMIN, DOCTOR, or RECEPTIONIST
- Clinic-scoped queries (all operations filter by `clinicId`)

## Date Handling
- Uses `date-fns` throughout for date manipulation
- Spanish locale (`es`) for date formatting
- Week starts on Monday (`weekStartsOn: 1`)

## Status Flow
```
SCHEDULED → CONFIRMED → COMPLETED
         ↓           ↓
      CANCELLED  NO_SHOW
```

## UI Components
- Custom implementations: `toggle-group`, `alert-dialog` (using @radix-ui)
- Existing shadcn/ui: `button`, `dialog`, `select`, `input`, `textarea`, `label`

## Files Created
1. `app/(app)/agenda/actions.ts` - Server actions (486 lines)
2. `app/(app)/agenda/page.tsx` - Page component
3. `app/(app)/agenda/weekly-calendar.tsx` - Main calendar component (201 lines)
4. `app/(app)/agenda/calendar-grid.tsx` - Grid rendering (246 lines)
5. `app/(app)/agenda/appointment-card.tsx` - Card component (108 lines)
6. `app/(app)/agenda/create-appointment-dialog.tsx` - Creation form (254 lines)
7. `app/(app)/agenda/appointment-details-dialog.tsx` - Details/status management (175 lines)
8. `components/ui/toggle-group.tsx` - Manual component
9. `components/ui/alert-dialog.tsx` - Manual component

## Verification
- ✅ `npm run build` - No TypeScript errors
- ✅ `npm run lint` - No ESLint warnings
- ✅ All imports resolved
- ✅ Type safety maintained throughout

## Next Steps (Future Enhancements)
- Add recurring appointments support
- Implement appointment reminders (SMS/Email)
- Add waiting list integration
- Calendar printing/export functionality
- Mobile-responsive optimizations
- Real-time updates (WebSocket/SSE)
- Conflict resolution UI for overlaps
