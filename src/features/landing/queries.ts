import "server-only";
import { getLandingConfig, getLandingCoverMeta } from "@/features/settings/queries";

export type StudioInfo = {
  name: string;
  handle: string;
  city: string;
  tagline: string;
  about: string;
  callout: string;
  coverLabel: string;
  ctaLabel: string;
  /** URL do route handler com cache-buster; null quando não há imagem. */
  coverUrl: string | null;
};

/**
 * Carrega dados públicos do studio a partir de Settings.
 *
 * Os campos landing* foram adicionados à tabela settings via
 * migration `add_landing_fields_to_settings`. Se a migration ainda não foi
 * aplicada, getLandingConfig retorna os valores estáticos de fallback.
 *
 * Para editar pelo admin: /admin/ajustes/landing
 */
export async function getStudioInfo(): Promise<StudioInfo> {
  const [config, cover] = await Promise.all([getLandingConfig(), getLandingCoverMeta()]);

  return {
    name: config.landingName,
    handle: config.landingHandle,
    city: config.landingCity,
    tagline: config.landingTagline,
    about: config.landingAbout,
    callout: config.landingCallout,
    coverLabel: config.landingCoverLabel,
    ctaLabel: config.landingCtaLabel,
    coverUrl: cover ? `/api/landing/cover?v=${cover.updatedAt.getTime()}` : null,
  };
}
