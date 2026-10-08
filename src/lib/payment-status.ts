import type { PaymentStatus } from "@/admin/types";

export type PaymentStatusMeta = {
  label: string;
  badge: string;
};

/**
 * Label dan warna badge status tagihan.
 *
 * Verde untuk lunas, oranye untuk menunggu verifikasi, merah muda untuk yang
 * belum dibayar atau ditolak. Dipakai di panel admin maupun halaman pembayaran
 * peserta supaya satu status tidak pernah tampil dengan dua nama berbeda.
 */
export const PAYMENT_STATUS_META: Record<PaymentStatus, PaymentStatusMeta> = {
  paid: { label: "Lunas", badge: "bg-[#DFF7EC] text-[#1F9C63]" },
  verification: { label: "Verifikasi", badge: "bg-[#FFF2E1] text-[#B56A00]" },
  unpaid: { label: "Tertunda", badge: "bg-[#FDE7E7] text-[#C0392B]" },
  rejected: { label: "Ditolak", badge: "bg-[#FDE7E7] text-[#C0392B]" },
};

const FALLBACK: PaymentStatusMeta = {
  label: "Tertunda",
  badge: "bg-[#FDE7E7] text-[#C0392B]",
};

export function getPaymentStatusMeta(status: string): PaymentStatusMeta {
  return PAYMENT_STATUS_META[status as PaymentStatus] ?? FALLBACK;
}