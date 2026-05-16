import "server-only";
import { db } from "@/lib/db";

export type StudioInfo = {
  name: string;
  handle: string;
  city: string;
  tagline: string;
  about: string;
  callout: string;
  coverLabel: string;
  ctaLabel: string;
};

/**
 * Carrega dados públicos do studio.
 *
 * Em descoberta: settings tem o mínimo (slug, email). Os campos de marketing
 * (sobre, tagline, etc.) ainda não estão modelados — usamos fallback estático.
 * Quando precisarmos editar isso pelo admin, adicionamos colunas à tabela
 * settings ou criamos uma `landing_config`.
 */
export async function getStudioInfo(): Promise<StudioInfo> {
  const settings = await db.settings.findUnique({ where: { id: 1 } });
  void settings; // slug/email não usados na landing por enquanto

  return {
    name: "Estúdio Foz",
    handle: "@estudio.foz",
    city: "Foz do Iguaçu",
    tagline: "Fotografia e produção de conteúdo",
    about:
      "Trabalho com ensaios autorais, cobertura de eventos e produção de conteúdo para redes sociais. Atendimentos com hora marcada — você escolhe o horário e a gente alinha o restante pelo WhatsApp.",
    callout:
      "Os horários são reservados após o seu pedido. Em até 48h, entro em contato pelo WhatsApp para confirmar valores e detalhes.",
    coverLabel: "capa",
    ctaLabel: "Ver horários disponíveis",
  };
}
