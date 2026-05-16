"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { I } from "@/components/shared/icons";
import { loginAction } from "../actions";

interface LoginFormProps {
  studioName: string;
}

export function LoginForm({ studioName }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-screen flex-col">
      <div className="flex-1 overflow-y-auto px-5">
        <div className="pt-12">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {studioName}
          </div>
          <h1 className="mt-3 text-[30px] font-semibold leading-[1.05] tracking-tight">
            Bem-vindo
            <br />
            de volta.
          </h1>
          <p className="mt-4 max-w-[28ch] text-[14px] leading-relaxed text-muted-foreground">
            Entre para ver os pedidos pendentes e organizar a agenda da semana.
          </p>
        </div>

        <div className="mt-10 space-y-3.5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label
                htmlFor="password"
                className="text-[13px] font-medium text-foreground"
              >
                Senha
              </label>
              <button
                type="button"
                className="text-[12px] text-[var(--primary)] underline"
                onClick={() =>
                  setError("Recuperação de senha ainda não implementada nesta fase.")
                }
              >
                Esqueci
              </button>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[13px] text-destructive">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-3">
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isPending || !email || !password}
        >
          {isPending ? "Entrando…" : "Entrar"}
          {!isPending && <I.ArrowRight size={18} />}
        </Button>
        <p className="mt-3 text-center text-[11.5px] leading-snug text-muted-foreground">
          <I.Shield size={11} className="mb-0.5 mr-0.5 inline" /> Acesso protegido ·
          login + senha + recuperação por email
        </p>
      </div>
    </form>
  );
}
