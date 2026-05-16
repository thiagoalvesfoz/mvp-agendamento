import { I } from "@/components/shared/icons";

interface PlaceholderScreenProps {
  title: string;
  description?: string;
  icon?: keyof typeof I;
}

/**
 * Placeholder usado nas abas do admin enquanto o conteúdo real é implementado.
 * Em descoberta, mostra o título da aba e a próxima etapa.
 */
export function PlaceholderScreen({
  title,
  description,
  icon = "Sparkle",
}: PlaceholderScreenProps) {
  const Icon = I[icon];
  return (
    <div className="flex h-full flex-col px-5 pt-6">
      <div className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground">Admin</div>
      <h1 className="mt-2 text-[26px] font-semibold leading-[1.1] tracking-tight">{title}</h1>
      {description && (
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{description}</p>
      )}

      <div className="mt-10 flex flex-1 flex-col items-center justify-center pb-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon size={26} />
        </div>
        <p className="mt-4 text-[13px] text-muted-foreground">
          Em construção. Esta tela será preenchida na próxima iteração.
        </p>
      </div>
    </div>
  );
}
