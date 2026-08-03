import type { Modality } from "@/lib/calendar/types";
import { MODALITY_LABELS } from "@/lib/calendar/types";
import { Building2, MonitorPlay, Shuffle } from "lucide-react";

const styles: Record<
  Modality,
  { className: string; icon: typeof Building2 }
> = {
  aula: {
    className: "bg-teal/12 text-teal-deep border-teal/20",
    icon: Building2,
  },
  dad: {
    className: "bg-azure/12 text-azure border-azure/20",
    icon: MonitorPlay,
  },
  ibrida: {
    className: "bg-amber-100/80 text-amber-800 border-amber-200",
    icon: Shuffle,
  },
};

export function ModalityBadge({
  modality,
  compact = false,
}: {
  modality: Modality;
  compact?: boolean;
}) {
  const meta = styles[modality];
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${meta.className} ${compact ? "px-1.5" : ""}`}
    >
      <Icon className="h-3 w-3" />
      {MODALITY_LABELS[modality]}
    </span>
  );
}
