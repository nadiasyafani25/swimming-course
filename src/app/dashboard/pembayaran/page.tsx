import type { Metadata } from "next";
import DashboardShell from "@/components/DashboardShell";
import PaymentReminder from "./PaymentReminder";
import PaymentCheckoutCard from "./PaymentCheckoutCard";
import { requireParticipant } from "@/lib/session";
import { getPaymentStatusMeta } from "@/lib/payment-status";
import {
  getActiveEnrollments,
  getPayments,
  getUpcomingPayment,
} from "@/lib/enrollment-data";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/payment-method";
import { getSiteSettings } from "@/lib/settings-db";

export const metadata: Metadata = {
  title: "Pembayaran - SwimmingCourse",
  description: "Riwayat dan tagihan pembayaran kursus renang.",
};

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

function formatRupiah(value: number): string {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function daysUntil(iso: string): number {
  return Math.ceil(
    (new Date(iso).getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000),
  );
}

export default async function DashboardPaymentPage() {
  const user = await requireParticipant();

  const [enrollments, history, upcoming, settings] = await Promise.all([
    getActiveEnrollments(user.id),
    getPayments(user.id),
    getUpcomingPayment(user.id),
    getSiteSettings(),
  ]);

  const active = enrollments[0] ?? null;
  const amount = active?.priceMonthly ?? 0;
  const courseName = active?.name ?? null;
  const upcomingMeta = getPaymentStatusMeta(upcoming?.status ?? "unpaid");
  // Semua periode ditampilkan, bukan hanya yang lunas: status "Verifikasi" atau
  // "Ditolak" yang decided admin harus langsung terlihat peserta.
  const paidHistory = history;

  // Daftar pilihan ditentukan toggle di Pengaturan saja. Rincian pembayaran
  // (kode QRIS, nomor rekening) sengaja tidak ikut memfilter: memblokir
  // peserta hanya karena rinciannya belum diisi tidak menyelesaikan apa pun,
  // karena yang tetap bisa dilakukan adalah memilih metode lalu mengirim bukti.
  const availableMethods = PAYMENT_METHODS.filter((method) =>
    method === "qris" ? settings.enableQrisPayment : settings.enableBankTransfer,
  ) as PaymentMethod[];

  return (
    <DashboardShell
      userName={`${user.firstName} ${user.lastName}`}
      title="Pembayaran"
    >
      <div className="grid gap-[18px] xl:grid-cols-2">
        {/* Left Card */}
        <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-[#073763]">
              Tagihan aktif
            </h2>
            {upcoming && (
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[9px] font-medium ${upcomingMeta.badge}`}
              >
                {upcomingMeta.label}
              </span>
            )}
          </div>

          <PaymentReminder
            dueDate={upcoming?.dueDate ?? null}
            daysLeft={upcoming ? daysUntil(upcoming.dueDate) : null}
          />

          <div className="mb-5 rounded-[9px] border border-[#D6E5F3] bg-[#F0F7FF] p-4">
            <p className="text-[11px] text-[#526B84]">
              {courseName
                ? `${courseName} - iuran bulanan`
                : "Belum ada tagihan"}
            </p>
            <div className="mt-2 text-[28px] font-bold leading-tight text-[#073763]">
              {amount > 0 ? formatRupiah(amount) : "-"}
            </div>
            <p className="mt-2 text-[11px] text-[#526B84]">
              Jatuh tempo:{" "}
              {upcoming ? formatLongDate(upcoming.dueDate) : "-"}
            </p>
          </div>

          <h3 className="mb-3 text-[11px] font-semibold text-[#073763]">
            Riwayat tagihan singkat
          </h3>
          <div className="overflow-x-auto rounded-[9px] border border-[#D6E5F3]">
            <table className="w-full min-w-[320px] border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                    Bulan
                  </th>
                  <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                    Jumlah
                  </th>
                  <th className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paidHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-5 text-center text-[11px] text-[#8FA3B8]"
                    >
                      Belum ada riwayat tagihan.
                    </td>
                  </tr>
                ) : (
                  paidHistory.map((p) => {
                    const meta = getPaymentStatusMeta(p.status);

                    return (
                      <tr key={p.id}>
                        <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#073763]">
                          {formatLongDate(p.periodMonth)}
                        </td>
                        <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#073763]">
                          {formatRupiah(p.amount)}
                        </td>
                        <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                          <span
                            className={`inline-block rounded-full px-2.5 py-1 text-[9px] font-medium ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Card */}
        <section className="rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
          <PaymentCheckoutCard
            paymentId={upcoming?.id ?? null}
            periodLabel={
              upcoming ? formatLongDate(upcoming.periodMonth) : null
            }
            hasProof={upcoming?.hasProof ?? false}
            initialMethod={upcoming?.method ?? null}
            available={availableMethods}
            settings={settings}
            amount={amount > 0 ? formatRupiah(amount) : "-"}
          />
        </section>
      </div>
    </DashboardShell>
  );
}
