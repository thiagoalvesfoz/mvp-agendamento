"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h2 className="text-2xl font-bold">Algo deu errado</h2>
      <p className="max-w-prose text-muted-foreground">
        Tivemos um problema ao processar sua solicitação. Você pode tentar novamente.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Tentar novamente
      </button>
    </main>
  );
}
