/**
 * Servicio de notificaciones para recordatorios de citas
 * Canal funcional: Email (usando Resend)
 * Canales stub: SMS y WhatsApp (solo logs)
 */

import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Lazy initialization de Resend para evitar errores en build time
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY no está configurada en las variables de entorno');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

interface AppointmentData {
  id: string;
  start: Date;
  end: Date;
  patient: {
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  treatmentType?: {
    name: string;
  } | null;
  staffMember?: {
    firstName: string;
    lastName: string;
  } | null;
  clinic: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
  };
}

interface NotificationResult {
  success: boolean;
  notificationLogId?: string;
  error?: string;
}

/**
 * Compone el contenido HTML del recordatorio de cita
 */
export function composeAppointmentReminderEmail(appointment: AppointmentData): {
  subject: string;
  html: string;
  text: string;
} {
  const { patient, clinic, treatmentType, staffMember, start, end } = appointment;

  const dateFormatted = format(start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const timeFormatted = format(start, 'HH:mm', { locale: es });
  const endTimeFormatted = format(end, 'HH:mm', { locale: es });

  const treatmentName = treatmentType?.name || 'Consulta';
  const doctorName = staffMember 
    ? `Dr. ${staffMember.firstName} ${staffMember.lastName}` 
    : 'nuestro equipo';

  const subject = `Recordatorio: Tu cita en ${clinic.name}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px 10px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f9fafb;
      padding: 30px;
      border-radius: 0 0 10px 10px;
    }
    .appointment-details {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .detail-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: 600;
      min-width: 120px;
      color: #6b7280;
    }
    .detail-value {
      color: #111827;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🦷 Recordatorio de Cita</h1>
  </div>
  <div class="content">
    <p>Hola <strong>${patient.firstName} ${patient.lastName}</strong>,</p>
    <p>Te recordamos tu próxima cita en <strong>${clinic.name}</strong>:</p>
    
    <div class="appointment-details">
      <div class="detail-row">
        <span class="detail-label">📅 Fecha:</span>
        <span class="detail-value">${dateFormatted}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🕐 Hora:</span>
        <span class="detail-value">${timeFormatted} - ${endTimeFormatted}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🦷 Tratamiento:</span>
        <span class="detail-value">${treatmentName}</span>
      </div>
      ${staffMember ? `
      <div class="detail-row">
        <span class="detail-label">👨‍⚕️ Doctor:</span>
        <span class="detail-value">${doctorName}</span>
      </div>
      ` : ''}
    </div>

    ${clinic.address ? `
    <p><strong>📍 Dirección:</strong><br>${clinic.address}</p>
    ` : ''}

    ${clinic.phone ? `
    <p><strong>📞 Teléfono:</strong> ${clinic.phone}</p>
    ` : ''}

    <p style="margin-top: 30px;">
      Por favor, confirma tu asistencia o cancela con al menos 24 horas de anticipación 
      si no puedes asistir.
    </p>

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      Si necesitas reprogramar o cancelar tu cita, por favor contáctanos lo antes posible.
    </p>
  </div>
  <div class="footer">
    <p>Este es un mensaje automático, por favor no respondas a este email.</p>
    <p>&copy; ${new Date().getFullYear()} ${clinic.name}. Todos los derechos reservados.</p>
  </div>
</body>
</html>
  `;

  const text = `
Recordatorio de Cita - ${clinic.name}

Hola ${patient.firstName} ${patient.lastName},

Te recordamos tu próxima cita:

Fecha: ${dateFormatted}
Hora: ${timeFormatted} - ${endTimeFormatted}
Tratamiento: ${treatmentName}
${staffMember ? `Doctor: ${doctorName}` : ''}

${clinic.address ? `Dirección: ${clinic.address}` : ''}
${clinic.phone ? `Teléfono: ${clinic.phone}` : ''}

Por favor, confirma tu asistencia o cancela con al menos 24 horas de anticipación.

---
Este es un mensaje automático.
${clinic.name} © ${new Date().getFullYear()}
  `;

  return { subject, html, text };
}

/**
 * Envía un recordatorio de cita por email usando Resend
 */
export async function sendAppointmentReminderEmail(
  appointment: AppointmentData
): Promise<NotificationResult> {
  const { patient, clinic } = appointment;

  if (!patient.email) {
    return {
      success: false,
      error: 'El paciente no tiene email registrado',
    };
  }

  const { subject, html, text } = composeAppointmentReminderEmail(appointment);

  try {
    // Crear log antes de enviar
    const notificationLog = await prisma.notificationLog.create({
      data: {
        clinicId: clinic.id,
        recipientEmail: patient.email,
        recipientPhone: patient.phone,
        recipientName: `${patient.firstName} ${patient.lastName}`,
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.EMAIL,
        subject,
        content: text,
        status: NotificationStatus.PENDING,
        metadata: JSON.stringify({ appointmentId: appointment.id }),
      },
    });

    // Enviar email con Resend
    const { data, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: patient.email,
      subject,
      html,
      text,
    });

    if (error) {
      // Actualizar log como fallido
      await prisma.notificationLog.update({
        where: { id: notificationLog.id },
        data: {
          status: NotificationStatus.FAILED,
          failedAt: new Date(),
          errorMessage: error.message || 'Error desconocido',
        },
      });

      return {
        success: false,
        notificationLogId: notificationLog.id,
        error: error.message,
      };
    }

    // Actualizar log como enviado
    await prisma.notificationLog.update({
      where: { id: notificationLog.id },
      data: {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
        metadata: JSON.stringify({ 
          appointmentId: appointment.id,
          resendId: data?.id,
        }),
      },
    });

    // Actualizar la cita para marcar que se envió recordatorio
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { reminderSentAt: new Date() },
    });

    console.log(`✅ Email enviado a ${patient.email} - Resend ID: ${data?.id}`);

    return {
      success: true,
      notificationLogId: notificationLog.id,
    };
  } catch (error) {
    console.error('Error enviando email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Simula envío de SMS (stub - solo logs)
 * En el futuro se puede integrar con Twilio, etc.
 */
export async function sendAppointmentReminderSMS(
  appointment: AppointmentData
): Promise<NotificationResult> {
  const { patient, clinic, start } = appointment;

  if (!patient.phone) {
    return {
      success: false,
      error: 'El paciente no tiene teléfono registrado',
    };
  }

  const dateFormatted = format(start, "d/MM/yyyy 'a las' HH:mm", { locale: es });
  const treatmentName = appointment.treatmentType?.name || 'Consulta';

  const message = `
Recordatorio de cita - ${clinic.name}
${patient.firstName}, tu cita de ${treatmentName} es el ${dateFormatted}.
${clinic.phone ? `Dudas: ${clinic.phone}` : ''}
  `.trim();

  try {
    // Crear log (stub)
    const notificationLog = await prisma.notificationLog.create({
      data: {
        clinicId: clinic.id,
        recipientPhone: patient.phone,
        recipientEmail: patient.email,
        recipientName: `${patient.firstName} ${patient.lastName}`,
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.SMS,
        content: message,
        status: NotificationStatus.SENT, // Stub: marcamos como enviado
        sentAt: new Date(),
        metadata: JSON.stringify({ 
          appointmentId: appointment.id,
          stub: true,
          note: 'SMS no implementado - solo log',
        }),
      },
    });

    console.log(`📱 [STUB] SMS a ${patient.phone}: ${message}`);

    return {
      success: true,
      notificationLogId: notificationLog.id,
    };
  } catch (error) {
    console.error('Error creando log de SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Simula envío de WhatsApp (stub - solo logs)
 * En el futuro se puede integrar con Twilio WhatsApp API, etc.
 */
export async function sendAppointmentReminderWhatsApp(
  appointment: AppointmentData
): Promise<NotificationResult> {
  const { patient, clinic, start, end } = appointment;

  if (!patient.phone) {
    return {
      success: false,
      error: 'El paciente no tiene teléfono registrado',
    };
  }

  const dateFormatted = format(start, "EEEE d 'de' MMMM", { locale: es });
  const timeFormatted = format(start, 'HH:mm', { locale: es });
  const endTimeFormatted = format(end, 'HH:mm', { locale: es });
  const treatmentName = appointment.treatmentType?.name || 'Consulta';

  const message = `
🦷 *Recordatorio de Cita*

Hola ${patient.firstName}!

Tienes una cita programada en *${clinic.name}*:

📅 ${dateFormatted}
🕐 ${timeFormatted} - ${endTimeFormatted}
🦷 ${treatmentName}

${clinic.address ? `📍 ${clinic.address}` : ''}

Por favor confirma tu asistencia. Si necesitas cancelar, háznoslo saber con anticipación.
  `.trim();

  try {
    // Crear log (stub)
    const notificationLog = await prisma.notificationLog.create({
      data: {
        clinicId: clinic.id,
        recipientPhone: patient.phone,
        recipientEmail: patient.email,
        recipientName: `${patient.firstName} ${patient.lastName}`,
        type: NotificationType.APPOINTMENT_REMINDER,
        channel: NotificationChannel.WHATSAPP,
        content: message,
        status: NotificationStatus.SENT, // Stub: marcamos como enviado
        sentAt: new Date(),
        metadata: JSON.stringify({ 
          appointmentId: appointment.id,
          stub: true,
          note: 'WhatsApp no implementado - solo log',
        }),
      },
    });

    console.log(`💬 [STUB] WhatsApp a ${patient.phone}: ${message}`);

    return {
      success: true,
      notificationLogId: notificationLog.id,
    };
  } catch (error) {
    console.error('Error creando log de WhatsApp:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
}

/**
 * Envía recordatorio por múltiples canales según disponibilidad
 */
export async function sendAppointmentReminder(
  appointment: AppointmentData,
  channels: NotificationChannel[] = [NotificationChannel.EMAIL]
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  for (const channel of channels) {
    let result: NotificationResult;

    switch (channel) {
      case NotificationChannel.EMAIL:
        result = await sendAppointmentReminderEmail(appointment);
        break;
      case NotificationChannel.SMS:
        result = await sendAppointmentReminderSMS(appointment);
        break;
      case NotificationChannel.WHATSAPP:
        result = await sendAppointmentReminderWhatsApp(appointment);
        break;
      default:
        result = {
          success: false,
          error: `Canal ${channel} no soportado`,
        };
    }

    results.push(result);
  }

  return results;
}
