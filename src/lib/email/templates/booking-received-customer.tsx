import { Text } from "@react-email/components";
import { InfoRow, Shell } from "./_shell";

/**
 * Acuse de recibo enviado pro cliente logo após o booking público.
 *
 * Status ainda é PENDING — o objetivo aqui é só dizer "chegou, obrigado,
 * aguarde contato pelo WhatsApp". Sem CTA: o cliente não precisa fazer nada.
 */

export interface BookingReceivedCustomerProps {
  protocol: string;
  customerName: string;
  serviceName: string;
  dateFormatted: string;
  startTime: string;
  studioName: string;
}

export function BookingReceivedCustomerEmail(props: BookingReceivedCustomerProps) {
  return (
    <Shell
      preview={`Recebemos seu pedido — protocolo ${props.protocol}`}
      heading="Recebemos seu pedido"
    >
      <Text>Oi {props.customerName.split(" ")[0] ?? props.customerName}, tudo bem?</Text>
      <Text>
        Seu pedido de agendamento foi registrado. Em breve entraremos em contato pelo WhatsApp para
        confirmar os detalhes e o valor.
      </Text>

      <InfoRow label="Protocolo" value={props.protocol} />
      <InfoRow label="Serviço" value={props.serviceName} />
      <InfoRow label="Data" value={`${props.dateFormatted} às ${props.startTime}`} />

      <Text style={{ marginTop: 16, color: "#7a7a72", fontSize: 13 }}>
        Atenciosamente,
        <br />
        {props.studioName}
      </Text>
    </Shell>
  );
}
