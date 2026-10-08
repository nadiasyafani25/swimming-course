import {
  CalendarDays,
  CreditCard,
  Dumbbell,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminStatCardData, AdminStatTone } from "../types";

const TONE_STYLES: Record<
  AdminStatTone,
  { icon: LucideIcon; accent: string; tint: string }
> = {
  navy: { icon: Users, accent: "#0D4D85", tint: "#0D4D8514" },
  blue: { icon: Dumbbell, accent: "#368DDF", tint: "#368DDF1A" },
  green: { icon: CalendarDays, accent: "#1F9C63", tint: "#1F9C6314" },
  amber: { icon: CreditCard, accent: "#B56A00", tint: "#B56A0014" },
};

export default function AdminStatCard({
  label,
  value,
  hint,
  tone,
}: AdminStatCardData) {
  const { icon: Icon, accent, tint } = TONE_STYLES[tone];

  return (
    <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-4 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium leading-[1.5] text-[#526B84]">
          {label}
        </p>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: tint }}
        >
          <Icon className="h-4 w-4" style={{ color: accent }} />
        </span>
      </div>

      <p className="mt-3 text-[26px] font-bold leading-none tracking-tight text-[#073763]">
        {value}
      </p>

      <p className="mt-3 text-[10px] font-medium text-[#8FA3B8]">{hint}</p>
    </section>
  );
}