import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.lastLoginAt = (user as { lastLoginAt?: string | null }).lastLoginAt ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { lastLoginAt?: string | null }).lastLoginAt =
          (token.lastLoginAt as string | null) ?? null;
      }
      return session;
    },
  },
};
