import { Text } from "@react-email/components";
import { Shell } from "./_shell";

interface EmailTestProps {
  adminEmail: string;
}

export function EmailTest({ adminEmail }: EmailTestProps) {
  return (
    <Shell preview="Teste de email — tudo funcionando!" heading="Email de teste">
      <Text style={{ margin: "0 0 12px" }}>
        Se você está lendo isso, o envio de emails está funcionando corretamente.
      </Text>
      <Text style={{ margin: "0 0 12px", color: "#7a7a72", fontSize: 13 }}>
        Destinatário configurado: {adminEmail}
      </Text>
    </Shell>
  );
}
