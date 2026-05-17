import "server-only";
import { sendEmail } from "@/lib/email/send";
import { BookingPendingAdminEmail } from "@/lib/email/templates/booking-pending-admin";
import { BookingReceivedCustomerEmail } from "@/lib/email/templates/booking-received-customer";
import { env } from "@/lib/env";

/**
 * Disparadores de email para o fluxo de booking público.
 *
 * Dados vêm sempre como parâmetros — nunca releia o banco aqui.
 * O caller monta o payload com base no que já está em memória após o commit.
 */

export interface NotifyAdminPendingInput {
  protocol: string;
  serviceName: string;
  dateFormatted: string; // "17/05/2026"
  startTime: string; // "14:30"
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerInstagram: string | null;
  briefing: string | null;
  appointmentId: string;
  // destinatário — admin configurou em /admin/ajustes/email
  adminEmail: string;
}

export async function notifyAdminPending(input: NotifyAdminPendingInput): Promise<void> {
  const adminAppointmentUrl = `${env.NEXT_PUBLIC_APP_URL}/admin/agenda/${input.appointmentId}`;

  await sendEmail({
    to: input.adminEmail,
    subject: `Novo pedido — ${input.customerName} (${input.dateFormatted})`,
    tag: "booking.pending.admin",
    react: BookingPendingAdminEmail({
      protocol: input.protocol,
      serviceName: input.serviceName,
      dateFormatted: input.dateFormatted,
      startTime: input.startTime,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      customerInstagram: input.customerInstagram,
      briefing: input.briefing,
      adminAppointmentUrl,
    }),
  });
}

export interface NotifyCustomerReceivedInput {
  protocol: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  dateFormatted: string;
  startTime: string;
  studioName: string;
}

export async function notifyCustomerReceived(input: NotifyCustomerReceivedInput): Promise<void> {
  await sendEmail({
    to: input.customerEmail,
    subject: `Recebemos seu pedido — protocolo ${input.protocol}`,
    tag: "booking.received.customer",
    react: BookingReceivedCustomerEmail({
      protocol: input.protocol,
      customerName: input.customerName,
      serviceName: input.serviceName,
      dateFormatted: input.dateFormatted,
      startTime: input.startTime,
      studioName: input.studioName,
    }),
  });
}
