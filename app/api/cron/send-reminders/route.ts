/**
 * Endpoint para enviar recordatorios de citas
 * Puede ejecutarse manualmente o mediante un cron job (Vercel Cron, etc.)
 * 
 * Busca citas próximas y envía recordatorios según las reglas:
 * - 24 horas antes (configurable en el futuro)
 * - Solo citas con estado SCHEDULED o CONFIRMED
 * - Solo si no se ha enviado recordatorio previamente
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAppointmentReminder } from '@/lib/notifications';
import { addHours } from 'date-fns';

// Tipos para los enums
type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

// Configuración de recordatorios (hardcoded por ahora)
const REMINDER_HOURS_BEFORE = 24; // Enviar 24 horas antes
const REMINDER_WINDOW_HOURS = 2; // Ventana de 2 horas para capturar citas

// Canales a usar (por ahora solo EMAIL funcional)
const NOTIFICATION_CHANNELS: NotificationChannel[] = [
  'EMAIL',
  // 'SMS', // Descomentar cuando se implemente
  // 'WHATSAPP', // Descomentar cuando se implemente
];

export async function GET(request: Request) {
  try {
    // Verificar autenticación básica (opcional)
    // En producción, usar un token o Vercel Cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const now = new Date();
    
    // Calcular ventana de tiempo para buscar citas
    // Ejemplo: Si son las 10:00 del día 1, buscar citas entre las 08:00 y 12:00 del día 2
    const reminderStart = addHours(now, REMINDER_HOURS_BEFORE - REMINDER_WINDOW_HOURS);
    const reminderEnd = addHours(now, REMINDER_HOURS_BEFORE + REMINDER_WINDOW_HOURS);

    console.log(`🔍 Buscando citas entre ${reminderStart.toISOString()} y ${reminderEnd.toISOString()}`);

    // Buscar citas que necesitan recordatorio
    const appointments = await prisma.appointment.findMany({
      where: {
        start: {
          gte: reminderStart,
          lte: reminderEnd,
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
        reminderSentAt: null, // No se ha enviado recordatorio
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        treatmentType: {
          select: {
            name: true,
          },
        },
        staffMember: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    console.log(`📋 Encontradas ${appointments.length} citas para enviar recordatorio`);

    if (appointments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay citas pendientes de recordatorio',
        processed: 0,
        sent: 0,
        failed: 0,
      });
    }

    // Enviar recordatorios
    let sentCount = 0;
    let failedCount = 0;
    const results = [];

    for (const appointment of appointments) {
      console.log(`📤 Procesando cita ${appointment.id} para ${appointment.patient.firstName} ${appointment.patient.lastName}`);

      try {
        const notificationResults = await sendAppointmentReminder(
          appointment,
          NOTIFICATION_CHANNELS
        );

        // Verificar si al menos un canal fue exitoso
        const anySuccess = notificationResults.some(r => r.success);
        
        if (anySuccess) {
          sentCount++;
          results.push({
            appointmentId: appointment.id,
            patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            status: 'sent',
            channels: notificationResults.map(r => ({
              success: r.success,
              error: r.error,
            })),
          });
        } else {
          failedCount++;
          results.push({
            appointmentId: appointment.id,
            patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            status: 'failed',
            channels: notificationResults.map(r => ({
              success: r.success,
              error: r.error,
            })),
          });
        }
      } catch (error) {
        console.error(`❌ Error procesando cita ${appointment.id}:`, error);
        failedCount++;
        results.push({
          appointmentId: appointment.id,
          patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          status: 'error',
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    console.log(`✅ Proceso completado: ${sentCount} enviados, ${failedCount} fallidos`);

    return NextResponse.json({
      success: true,
      message: `Recordatorios procesados: ${sentCount} enviados, ${failedCount} fallidos`,
      processed: appointments.length,
      sent: sentCount,
      failed: failedCount,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('❌ Error en cron de recordatorios:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

// Permitir también POST para testing manual
export async function POST(request: Request) {
  return GET(request);
}
