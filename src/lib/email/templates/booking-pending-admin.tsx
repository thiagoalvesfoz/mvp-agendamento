import { Text } from "@react-email/components";
import { Cta, InfoRow, Shell } from "./_shell";

/**
 * Email para o admin quando o booking público cria um agendamento PENDING.
 *
 * Objetivo: avisar com link direto pro detalhe, onde admin confirma/recusa.
 * Sem botões de ação no email — segurança + simplicidade no MVP.
 */

export interface BookingPendingAdminProps {
  protocol: string;
  serviceName: string;
  dateFormatted: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerInstagram: string | null;
  briefing: string | null;
  adminAppointmentUrl: string;
}

export function BookingPendingAdminEmail(props: BookingPendingAdminProps) {
  return (
    <Shell preview={`Novo pedido — ${props.customerName}`} heading="Novo pedido de agendamento">
      <Text>
        Você recebeu um novo pedido pelo site. Ele está com status <strong>pendente</strong> até
        você confirmar.
      </Text>

      <InfoRow label="Protocolo" value={props.protocol} />
      <InfoRow label="Serviço" value={props.serviceName} />
      <InfoRow label="Data" value={`${props.dateFormatted} às ${props.startTime}`} />
      <InfoRow label="Cliente" value={props.customerName} />
      <InfoRow label="Telefone" value={props.customerPhone} />
      {props.customerEmail && <InfoRow label="Email" value={props.customerEmail} />}
      {props.customerInstagram && <InfoRow label="Instagram" value={props.customerInstagram} />}

      {props.briefing && (
        <Text style={{ marginTop: 16 }}>
          <span style={{ color: "#7a7a72" }}>Briefing:</span>
          <br />
          {props.briefing}
        </Text>
      )}

      <Cta href={props.adminAppointmentUrl} label="Abrir no painel" />
    </Shell>
  );
}
