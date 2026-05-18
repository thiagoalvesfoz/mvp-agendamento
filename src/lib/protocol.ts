/** Gera protocolo no formato AG-YYYYMMDD-XXXX (Crockford-ish, sem 0/O/I/L). */
export function generateProtocol(): string {
  const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 31 chars
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `AG-${ymd}-${suffix}`;
}
