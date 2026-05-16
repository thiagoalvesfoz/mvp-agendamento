"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { I } from "@/components/shared/icons";
import { parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ServiceForBooking } from "../queries";

interface ConfirmationViewProps {
  service: ServiceForBooking;
  date: string;
  startTime: string;
  endTime: string;
  protocol: string;
  onExit: () => void;
}

function fmtLongDate(iso: string): string {
  return format(parseISO(iso), "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function ConfirmationView({
  service,
  date,
  startTime,
  endTime,
  protocol,
  onExit,
}: ConfirmationViewProps) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex flex-col items-center px-5 pt-6 text-center">
      <div className="bg-[var(--primary)]/10 flex size-14 items-center justify-center rounded-full text-[var(--primary)]">
        <I.Check size={28} strokeWidth={2.2} />
      </div>
      <h2 className="mt-4 text-[22px] font-semibold leading-tight tracking-tight">
        Pedido enviado
      </h2>
      <p className="mt-2 max-w-[28ch] text-[14px] text-muted-foreground">
        Em até 48h entraremos em contato pelo WhatsApp para confirmar valores e detalhes.
      </p>

      <Card className="mt-5 w-full p-4 text-left">
        <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Protocolo
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-[22px] font-medium tracking-tight">{protocol}</span>
          <button
            onClick={() => {
              void navigator.clipboard?.writeText(protocol);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
            className="press inline-flex items-center gap-1.5 text-[13px] text-muted-foreground"
          >
            {copied ? (
              <>
                <I.Check size={14} /> copiado
              </>
            ) : (
              <>
                <I.Copy size={14} /> copiar
              </>
            )}
          </button>
        </div>
        <div className="my-4 h-px bg-border" />
        <div className="space-y-2.5 text-[13px]">
          <Row icon={<I.Camera size={15} />} k="Serviço" v={service.name} />
          <Row icon={<I.Calendar size={15} />} k="Data" v={fmtLongDate(date)} />
          <Row icon={<I.Clock size={15} />} k="Horário" v={`${startTime} – ${endTime}`} />
        </div>
      </Card>

      <Card className="bg-muted/40 mt-3 w-full p-4 text-left">
        <div className="flex gap-2.5">
          <I.Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
          <div className="text-[12.5px] leading-snug text-muted-foreground">
            Seu horário já está <span className="font-medium text-foreground">reservado</span>. Se
            não confirmarmos em 48h, o pedido expira e o horário volta a ficar disponível.
          </div>
        </div>
      </Card>

      <div className="mt-5 w-full">
        <Button variant="outline" size="lg" className="w-full" onClick={onExit}>
          Voltar para o início
        </Button>
      </div>
    </div>
  );
}

function Row({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-muted-foreground">{icon}</span>
      <span className="w-16 text-muted-foreground">{k}</span>
      <span className="flex-1 text-foreground">{v}</span>
    </div>
  );
}
