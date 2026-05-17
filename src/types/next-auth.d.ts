import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    lastLoginAt?: string | null;
  }

  interface Session {
    user: {
      id?: string;
      lastLoginAt?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    lastLoginAt?: string | null;
  }
}
