"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { db } from "@/lib/db";

export type LoginResult = { ok: true } | { ok: false; error: string };

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
}

/**
 * Login do admin. Em sucesso, NextAuth redireciona pela `redirectTo`.
 * O `signIn` lança internamente um `NEXT_REDIRECT` quando dá certo,
 * que NÃO devemos capturar — propaga normalmente.
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { ok: false, error: "Preencha email e senha." };
  }

  const ip = await getClientIp();

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
    return { ok: true };
  } catch (err) {
    // NEXT_REDIRECT = login bem-sucedido — agenda log e repropaga
    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      after(() => db.loginAttempt.create({ data: { email, ip, success: true } }));
      throw err;
    }

    after(() => db.loginAttempt.create({ data: { email, ip, success: false } }));

    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { ok: false, error: "Email ou senha incorretos." };
      }
      return { ok: false, error: "Não foi possível entrar. Tente novamente." };
    }
    throw err;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}
