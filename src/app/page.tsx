import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoPlaceholder } from "@/components/shared/photo-placeholder";
import { I } from "@/components/shared/icons";
import { getStudioInfo } from "@/features/landing/queries";

export const revalidate = 300;

export default async function LandingPage() {
  const studio = await getStudioInfo();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background">
      <header className="flex items-center justify-between px-5 pb-2 pt-3">
        <span className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground">
          {studio.handle}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <I.MapPin size={12} /> {studio.city}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <section className="px-5 pt-4">
          <h1 className="text-[32px] font-semibold leading-[1.05] tracking-tight">{studio.name}</h1>
          {studio.tagline && (
            <p className="mt-1 text-[18px] font-medium text-muted-foreground">{studio.tagline}.</p>
          )}
        </section>

        <section className="mt-5 px-5">
          {studio.coverUrl ? (
            <div className="relative h-[200px] w-full overflow-hidden rounded-[10px]">
              <Image
                src={studio.coverUrl}
                alt={studio.coverLabel || "Capa do estúdio"}
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 440px) calc(100vw - 40px), 400px"
                className="object-cover"
              />
            </div>
          ) : (
            <PhotoPlaceholder label={studio.coverLabel} className="h-[200px] w-full" />
          )}
        </section>

        {studio.about && (
          <section className="mt-6 px-5">
            <div className="mb-3 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
              Sobre
            </div>
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-foreground">
              {studio.about}
            </p>
          </section>
        )}

        {studio.callout && (
          <section className="mb-6 mt-6 px-5">
            <Card className="bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <I.Info size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                <div className="text-[12.5px] leading-snug text-muted-foreground">
                  {studio.callout}
                </div>
              </div>
            </Card>
          </section>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background via-background to-transparent px-5 pb-5 pt-3">
        <div className="mx-auto max-w-[440px]">
          <Button asChild size="lg" className="w-full">
            <Link href="/agendar">
              {studio.ctaLabel} <I.ArrowRight size={18} />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
