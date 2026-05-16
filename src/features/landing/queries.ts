import "server-only";
import { getLandingConfig } from "@/features/settings/queries";

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
 * Carrega dados públicos do studio a partir de Settings.
 *
 * Os campos landing* foram adicionados à tabela settings via
 * migration `add_landing_fields_to_settings`. Se a migration ainda não foi
 * aplicada, getLandingConfig retorna os valores estáticos de fallback.
 *
 * Para editar pelo admin: /admin/ajustes/landing
 */
export async function getStudioInfo(): Promise<StudioInfo> {
  const config = await getLandingConfig();

  return {
    name: config.landingName,
    handle: config.landingHandle,
    city: config.landingCity,
    tagline: config.landingTagline,
    about: config.landingAbout,
    callout: config.landingCallout,
    coverLabel: config.landingCoverLabel,
    ctaLabel: config.landingCtaLabel,
  };
}
