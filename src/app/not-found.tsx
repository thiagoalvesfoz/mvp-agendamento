import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h2 className="text-3xl font-bold">Página não encontrada</h2>
      <p className="text-muted-foreground">A página que você procura não existe ou foi movida.</p>
      <Link
        href="/"
        className="hover:bg-primary/90 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
