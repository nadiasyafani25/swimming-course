const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatTanggal(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function PaymentReminder({
  dueDate,
  daysLeft,
}: {
  dueDate: string | null;
  daysLeft: number | null;
}) {
  if (!dueDate || daysLeft === null) return null;

  const label = `Jatuh tempo ${formatTanggal(dueDate)}.`;

  if (daysLeft < 0) {
    return (
      <div className="mb-4 rounded-[9px] border border-[#F0C9C9] bg-[#FDEBEB] px-3 py-2 text-[11px] text-[#A32020]">
        Tagihan sudah lewat jatuh tempo. Segera lakukan pembayaran. {label}
      </div>
    );
  }

  if (daysLeft === 0) {
    return (
      <div className="mb-4 rounded-[9px] border border-[#F2E0B3] bg-[#FFF8E1] px-3 py-2 text-[11px] text-[#8A5A00]">
        Tagihan jatuh tempo hari ini. Segera lakukan pembayaran. {label}
      </div>
    );
  }

  if (daysLeft <= 3) {
    return (
      <div className="mb-4 rounded-[9px] border border-[#F2E0B3] bg-[#FFF8E1] px-3 py-2 text-[11px] text-[#8A5A00]">
        Pengingat: tagihan jatuh tempo dalam {daysLeft} hari. {label}
      </div>
    );
  }

  return null;
}