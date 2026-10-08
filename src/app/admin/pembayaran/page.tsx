import type { Metadata } from "next";
import PaymentStatCards from "@/admin/pembayaran/PaymentStatCards";
import PaymentTable from "@/admin/pembayaran/PaymentTable";
import { getPaymentStats, listPaymentRows } from "@/admin/data";

export const metadata: Metadata = {
  title: "Pembayaran - Panel Admin",
  description: "Kelola verifikasi pembayaran kursus SwimmingCourse.",
};

export default async function AdminPaymentsPage() {
  const [payments, stats] = await Promise.all([
    listPaymentRows(),
    getPaymentStats(),
  ]);

  return (
    <>
      <div>
        <h2 className="text-[16px] font-bold text-[#073763]">Pembayaran</h2>
        <p className="mt-1 text-[12px] text-[#526B84]">
          Semua angka dan baris di halaman ini dibaca langsung dari tabel
          payments. Status yang berubah di sini langsung tampil di dashboard dan
          halaman pembayaran peserta.
        </p>
      </div>

      <PaymentStatCards stats={stats} />

      <PaymentTable payments={payments} />
    </>
  );
}