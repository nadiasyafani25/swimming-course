"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Search, X } from "lucide-react";
import type { PaymentRow, PaymentStatus } from "@/admin/types";
import { getPaymentStatusMeta } from "@/lib/payment-status";
import {
  formatDueDate,
  formatPeriodMonth,
  formatRupiah,
} from "@/admin/pembayaran/payment-format";
import PaymentProofModal from "@/admin/pembayaran/PaymentProofModal";

const STATUS_FILTERS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "verification", label: "Verifikasi" },
  { value: "paid", label: "Lunas" },
  { value: "unpaid", label: "Tertunda" },
  { value: "rejected", label: "Ditolak" },
];

/**
 * Kolom METODE bukan lagi konstanta. Peserta memilih QRIS atau transfer bank
 * sebelum mengunggah bukti, dan pilihannya tersimpan di `payments.method`
 * bersamaan dengan berkasnya. Tagihan yang belum punya bukti masih
 * menampilkan nilai default dari database (`qris`, ditampilkan "QRIS").
 */
type Notice = { tone: "sukses" | "gagal"; text: string } | null;

type RejectState = { payment: PaymentRow; note: string } | null;

type PaymentTableProps = {
  payments: PaymentRow[];
};

export default function PaymentTable({ payments }: PaymentTableProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [rows, setRows] = useState(payments);
  const [syncedPayments, setSyncedPayments] = useState(payments);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PaymentRow | null>(null);
  const [rejecting, setRejecting] = useState<RejectState | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  if (syncedPayments !== payments) {
    setSyncedPayments(payments);
    setRows(payments);
  }

  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return rows.filter((payment) => {
      const matchStatus =
        statusFilter === "all" || payment.status === statusFilter;
      if (!matchStatus) return false;
      if (!keyword) return true;

      return (
        payment.participantName.toLowerCase().includes(keyword) ||
        payment.participantEmail.toLowerCase().includes(keyword) ||
        (payment.packageName ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [rows, query, statusFilter]);

  /**
   * Setujui atau tolak bukti bayar.
   *
   * Baris langsung berubah supaya admin tidak menunggu, lalu `router.refresh()`
   * mengambil ulang angka kartu ringkasan dan halaman peserta dari server.
   */
  const updateStatus = async (
    payment: PaymentRow,
    status: PaymentStatus,
    note?: string,
  ) => {
    const previous = rows;
    setPendingId(payment.id);
    setRows((current) =>
      current.map((item) =>
        item.id === payment.id ? { ...item, status } : item,
      ),
    );
    setNotice(null);

    try {
      const res = await fetch(`/api/admin/payments/${payment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setRows(previous);
        setNotice({ tone: "gagal", text: data?.error ?? "Gagal menyimpan status." });
        return;
      }

      const label =
        status === "paid"
          ? "disetujui"
          : status === "rejected"
            ? "ditolak"
            : "diperbarui";

      setNotice({
        tone: "sukses",
        text: `Pembayaran ${payment.participantName} ${label}. Status di halaman peserta ikut berubah.`,
      });
      setRejecting(null);
      router.refresh();
    } catch {
      setRows(previous);
      setNotice({ tone: "gagal", text: "Gagal menghubungi server." });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#A9BACB]" />
            <label className="sr-only" htmlFor="cari-peserta">
              Cari peserta
            </label>
            <input
              id="cari-peserta"
              type="search"
              value={query}
              placeholder="Cari peserta atau paket"
              onChange={(e) => setQuery(e.target.value)}
              className="h-[34px] w-[220px] rounded-lg border border-[#D6E5F3] bg-white pl-8 pr-2.5 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#368DDF]"
            />
          </div>

          <label className="sr-only" htmlFor="filter-status">
            Filter status
          </label>
          <select
            id="filter-status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as PaymentStatus | "all")
            }
            className="h-[34px] rounded-lg border border-[#D6E5F3] bg-white px-2.5 text-[12px] text-[#073763] outline-none transition-colors focus:border-[#368DDF]"
          >
            {STATUS_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <span className="text-[11px] text-[#8FA3B8]">
            {visible.length} transaksi
          </span>
        </div>

        {notice && (
          <p
            role="status"
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-medium ${
              notice.tone === "sukses"
                ? "border-[#BFE3D2] bg-[#F1FBF6] text-[#0B7A4B]"
                : "border-[#F3C9C4] bg-[#FEF4F3] text-[#B42318]"
            }`}
          >
            {notice.text}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(7,55,99,0.08)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr>
                {["Peserta", "Paket", "Jumlah", "Metode", "Status", "Aksi"].map(
                  (column) => (
                    <th
                      key={column}
                      className="border-b border-[#D6E5F3] bg-[#E5F1FC] px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wide text-[#073763]"
                    >
                      {column}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-[12px] text-[#8FA3B8]"
                  >
                    Belum ada data pembayaran. Tagihan akan muncul di sini begitu
                    peserta mendaftar kursus.
                  </td>
                </tr>
              ) : visible.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-[12px] text-[#8FA3B8]"
                  >
                    Tidak ada transaksi ditemukan untuk pencarian atau filter
                    ini.
                  </td>
                </tr>
              ) : (
                visible.map((payment) => {
                  const meta = getPaymentStatusMeta(payment.status);
                  const isPending = pendingId === payment.id;

                  return (
                    <tr
                      key={payment.id}
                      className={isPending ? "opacity-60" : undefined}
                    >
                      <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                        <span className="block text-[11px] font-semibold text-[#073763]">
                          {payment.participantName}
                        </span>
                        <span className="block text-[10px] text-[#8FA3B8]">
                          {payment.participantEmail}
                        </span>
                        <span className="mt-0.5 block text-[9px] text-[#A9BACB]">
                          Tagihan {formatPeriodMonth(payment.periodMonth)} · tempo{" "}
                          {formatDueDate(payment.dueDate)}
                        </span>
                      </td>

                      <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#526B84]">
                        {payment.packageName ?? "Tanpa paket"}
                      </td>

                      <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] font-semibold text-[#073763]">
                        {formatRupiah(payment.amount)}
                      </td>

                      <td className="border-b border-[#D6E5F3] px-3 py-[11px] text-[11px] text-[#526B84]">
                        {payment.methodLabel}
                      </td>

                      <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                        <span
                          className={`inline-block rounded-full px-2.5 py-1 text-[9px] font-medium ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </td>

                      <td className="border-b border-[#D6E5F3] px-3 py-[11px]">
                        <div className="flex items-center gap-1.5">
                          {/* Pratinjau selalu ada, termasuk saat status
                              "verification": justru di status itu admin
                              butuh melihat bukti yang sedang diverifikasi. */}
                          <button
                            type="button"
                            title={
                              payment.hasProof
                                ? "Lihat bukti bayar"
                                : "Belum ada bukti bayar"
                            }
                            aria-label={`Lihat bukti bayar ${payment.participantName}`}
                            onClick={() => setPreview(payment)}
                            className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E5F1FC] text-[#1769AA] transition-colors hover:bg-[#1769AA] hover:text-white"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {payment.status === "verification" && (
                            <>
                              <button
                                type="button"
                                title="Setujui pembayaran"
                                aria-label={`Setujui pembayaran ${payment.participantName}`}
                                disabled={isPending}
                                onClick={() =>
                                  void updateStatus(payment, "paid")
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E5F1FC] text-[#1769AA] transition-colors hover:bg-[#1769AA] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" strokeWidth={2.4} />
                              </button>

                              <button
                                type="button"
                                title="Tolak bukti bayar"
                                aria-label={`Tolak pembayaran ${payment.participantName}`}
                                disabled={isPending}
                                onClick={() =>
                                  setRejecting({ payment, note: "" })
                                }
                                className="flex h-7 w-7 items-center justify-center rounded-md bg-[#FDE7E7] text-[#C0392B] transition-colors hover:bg-[#C0392B] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <X className="h-4 w-4" strokeWidth={2.4} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {preview && (
        <PaymentProofModal
          payment={preview}
          onClose={() => setPreview(null)}
        />
      )}

      {rejecting && (
        <RejectPaymentModal
          payment={rejecting.payment}
          note={rejecting.note}
          onNoteChange={(note) =>
            setRejecting((current) => (current ? { ...current, note } : current))
          }
          onCancel={() => setRejecting(null)}
          onConfirm={() =>
            void updateStatus(rejecting.payment, "rejected", rejecting.note)
          }
          saving={pendingId === rejecting.payment.id}
        />
      )}
    </>
  );
}

type RejectPaymentModalProps = {
  payment: PaymentRow;
  note: string;
  saving: boolean;
  onNoteChange: (note: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Konfirmasi penolakan bukti bayar.
 *
 * Pesan di bawah kolom wajib diisi karena inilah yang dibaca admin saat
 * menghubungi peserta; isinya dicatat sebagai jejak audit di server sampai
 * tersedia tabel notifikasi.
 */
function RejectPaymentModal({
  payment,
  note,
  saving,
  onNoteChange,
  onCancel,
  onConfirm,
}: RejectPaymentModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4 py-6"
      onClick={() => !saving && onCancel()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-payment-title"
        className="w-full max-w-[440px] rounded-xl border border-[#D6E5F3] bg-white p-5 shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="reject-payment-title"
          className="text-[15px] font-bold text-[#073763]"
        >
          Tolak bukti bayar
        </h3>
        <p className="mt-1 text-[11px] leading-[1.6] text-[#526B84]">
          Tagihan {formatRupiah(payment.amount)} milik{" "}
          {payment.participantName} akan berstatus Ditolak dan peserta diminta
          mengunggah ulang bukti.
        </p>
        <p className="mt-2 rounded-lg bg-[#F0F7FF] px-3 py-2 text-[11px] text-[#1769AA]">
          Metode pembayaran saat ini: {payment.methodLabel}. Peserta boleh
          memilih metode lain saat mengunggah ulang.
        </p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
            Pesan untuk peserta
          </span>
          <textarea
            rows={3}
            value={note}
            autoFocus
            placeholder="Contoh: bukti_transfer.png tidak terbaca, mohon unggah ulang."
            onChange={(e) => onNoteChange(e.target.value)}
            className="w-full resize-none rounded-lg border border-[#D6E5F3] bg-white px-3 py-2 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5]"
          />
        </label>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-[38px] flex-1 rounded-lg border border-[#D6E5F3] text-[12px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={saving || note.trim().length === 0}
            className="h-[38px] flex-1 rounded-lg bg-[#C0392B] text-[12px] font-semibold text-white transition-colors hover:bg-[#96281B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Tolak pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}