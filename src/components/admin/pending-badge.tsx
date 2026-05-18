"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<{ count: number }>);

export function PendingBadge() {
  const { data } = useSWR("/api/admin/agendamentos/pending-count", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  if (!data || data.count === 0) return null;

  return <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-destructive" />;
}
