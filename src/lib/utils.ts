/**
 * Utilitários compartilhados.
 *
 * `cn` é o helper padrão do shadcn/ui — combina clsx + tailwind-merge
 * para evitar conflito de classes Tailwind (ex: "p-2 p-4" → "p-4").
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
