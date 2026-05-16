"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

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

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/admin",
    });
    return { ok: true };
  } catch (err) {
    // NEXT_REDIRECT é o sucesso — relança pro Next tratar
    if (err instanceof Error && err.message === "NEXT_REDIRECT") {
      throw err;
    }
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
