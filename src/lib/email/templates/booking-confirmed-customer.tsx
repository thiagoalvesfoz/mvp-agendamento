import { Text } from "@react-email/components";
import { InfoRow, Shell } from "./_shell";

/**
 * Confirmação para o cliente quando o admin move o agendamento de
 * PENDING → CONFIRMED.
 *
 * Sem CTA externo — o cliente não precisa clicar em nada. WhatsApp segue
 * como canal principal de operação.
 */

export interface BookingConfirmedCustomerProps {
  protocol: string;
  customerName: string;
  serviceName: string;
  dateFormatted: string;
  startTime: string;
  studioName: string;
}

export function BookingConfirmedCustomerEmail(props: BookingConfirmedCustomerProps) {
  return (
    <Shell
      preview={`Agendamento confirmado — ${props.dateFormatted} às ${props.startTime}`}
      heading="Seu agendamento foi confirmado"
    >
      <Text>Oi {props.customerName.split(" ")[0] ?? props.customerName}!</Text>
      <Text>
        Tudo certo por aqui — seu horário está confirmado na agenda. Se precisar reagendar ou
        cancelar, fale com a gente pelo WhatsApp.
      </Text>

      <InfoRow label="Protocolo" value={props.protocol} />
      <InfoRow label="Serviço" value={props.serviceName} />
      <InfoRow label="Data" value={`${props.dateFormatted} às ${props.startTime}`} />

      <Text style={{ marginTop: 16, color: "#7a7a72", fontSize: 13 }}>
        Até lá!
        <br />
        {props.studioName}
      </Text>
    </Shell>
  );
}
