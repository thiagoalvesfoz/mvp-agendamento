/**
 * Configuração do Auth.js (NextAuth v5).
 *
 * Usa Credentials provider (email/senha) + Prisma adapter.
 * A página de login fica em /admin/login.
 *
 * Uso:
 *   import { auth } from "@/lib/auth";
 *   const session = await auth();  // em Server Components / Route Handlers
 */
import { authConfig } from "@/lib/auth.config";
import { db } from "@/lib/db";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.adminUser.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        const lastLogin = new Date();

        await db.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: lastLogin },
        });

        return {
          id: user.id,
          email: user.email,
          lastLoginAt: lastLogin.toISOString(),
        };
      },
    }),
  ],
});
