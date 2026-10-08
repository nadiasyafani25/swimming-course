import type { PaymentStats } from "@/admin/types";
import { formatRupiahShort, formatRupiah } from "@/admin/pembayaran/payment-format";

type PaymentStatCardsProps = {
  stats: PaymentStats;
};

type StatCard = {
  label: string;
  value: string;
  note: string;
  tone: "green" | "amber" | "red" | "navy";
};

const VALUE_TONE: Record<StatCard["tone"], string> = {
  green: "text-[#1F9C63]",
  amber: "text-[#B56A00]",
  red: "text-[#C0392B]",
  navy: "text-[#073763]",
};

/**
 * Empat kartu ringkasan, semuanya dihitung server dari tabel `payments`.
 *
 * "Total masuk bulan ini" memakai nominal penuh di catatan supaya admin tidak
 * perlu klik apa pun untuk tahu angkanya, sementara nilai besarnya memakai
 * format ringkas supaya kartu tetap muat.
 */
export default function PaymentStatCards({ stats }: PaymentStatCardsProps) {
  const cards: StatCard[] = [
    {
      label: "Total masuk bulan ini",
      value: formatRupiahShort(stats.revenueThisMonth),
      note:
        stats.revenueThisMonth > 0
          ? `Tagihan lunas ${formatRupiah(stats.revenueThisMonth)}`
          : "Belum ada tagihan lunas bulan ini",
      tone: "green",
    },
    {
      label: "Menunggu verifikasi",
      value: String(stats.pendingVerification),
      note:
        stats.pendingVerification > 0
          ? "Bukti bayar perlu diperiksa"
          : "Tidak ada bukti yang menunggu",
      tone: "amber",
    },
    {
      label: "Tertunda",
      value: String(stats.unpaid),
      note:
        stats.unpaid > 0
          ? "Tagihan aktif belum dibayar"
          : "Semua tagihan sudah dibayar",
      tone: "red",
    },
    {
      label: "Transaksi hari ini",
      value: String(stats.createdToday),
      note:
        stats.createdToday > 0
          ? "Tagihan dibuat hari ini"
          : "Belum ada tagihan hari ini",
      tone: "navy",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-[10px] border border-[#D6E5F3] bg-white p-4 shadow-[0_1px_3px_rgba(7,55,99,0.08)]"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8FA3B8]">
            {card.label}
          </p>
          <p
            className={`mt-2 text-[22px] font-bold leading-tight ${VALUE_TONE[card.tone]}`}
          >
            {card.value}
          </p>
          <p className="mt-1 text-[11px] text-[#526B84]">{card.note}</p>
        </div>
      ))}
    </div>
  );
}