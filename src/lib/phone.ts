/**
 * Máscara progressiva de telefone BR.
 *
 * Aplica `(xx) xxxxx-xxxx` para celular (11 dígitos) e
 * `(xx) xxxx-xxxx` para fixo (10 dígitos). Aceita digitação parcial —
 * vai formando os blocos conforme o usuário digita. Limita a 11 dígitos
 * (o componente que usa também deve limitar `maxLength` no input).
 */
export function maskPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const len = digits.length;

  if (len === 0) return "";
  if (len <= 2) return `(${digits}`;
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
