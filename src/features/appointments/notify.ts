import "server-only";
import { sendEmail } from "@/lib/email/send";
import { BookingConfirmedCustomerEmail } from "@/lib/email/templates/booking-confirmed-customer";

/**
 * Disparador de email para transições de status no painel admin.
 *
 * No MVP, só CONFIRMED notifica o cliente — CANCELED/EXPIRED ficam de fora
 * porque o atendimento com o cliente em casos de cancelamento já é tratado
 * pelo WhatsApp; email viraria ruído.
 */

export interface NotifyCustomerConfirmedInput {
  protocol: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  dateFormatted: string;
  startTime: string;
  studioName: string;
}

export async function notifyCustomerConfirmed(input: NotifyCustomerConfirmedInput): Promise<void> {
  await sendEmail({
    to: input.customerEmail,
    subject: `Agendamento confirmado — ${input.dateFormatted} às ${input.startTime}`,
    tag: "booking.confirmed.customer",
    react: BookingConfirmedCustomerEmail({
      protocol: input.protocol,
      customerName: input.customerName,
      serviceName: input.serviceName,
      dateFormatted: input.dateFormatted,
      startTime: input.startTime,
      studioName: input.studioName,
    }),
  });
}
