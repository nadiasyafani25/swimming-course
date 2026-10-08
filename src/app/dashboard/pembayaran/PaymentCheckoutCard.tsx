"use client";

import { useState } from "react";
import PaymentMethodPicker from "./PaymentMethodPicker";
import ProofUploadCard from "./ProofUploadCard";
import type { PaymentMethod } from "@/lib/payment-method";
import {
  getPaymentMethodLabel,
  isPaymentMethod,
} from "@/lib/payment-method";
import type { SiteSettings } from "@/lib/settings";

type PaymentCheckoutCardProps = {
  paymentId: string | null;
  periodLabel: string | null;
  hasProof: boolean;
  /** Metode yang tersimpan di tagihan; dipakai sebagai nilai awal pilihan. */
  initialMethod: string | null;
  available: PaymentMethod[];
  settings: Pick<
    SiteSettings,
    "qrisPayload" | "bankName" | "bankAccountNumber" | "bankAccountHolder"
  >;
  amount: string;
};

/**
 * Kartu bayar: pilih metode, lalu unggah bukti.
 *
 * Kedua langkahnya hidup di satu komponen client karena `method` yang dipilih
 * harus ikut terkirim bersama berkasnya. Halaman pembayaran tetap Server
 * Component; daftar metode aktif dan teks nominal sudah dihitung di server.
 */
export default function PaymentCheckoutCard({
  paymentId,
  periodLabel,
  hasProof,
  initialMethod,
  available,
  settings,
  amount,
}: PaymentCheckoutCardProps) {
  const [method, setMethod] = useState<PaymentMethod | null>(() =>
    isPaymentMethod(initialMethod) ? initialMethod : null,
  );

  const effective = method ?? available[0] ?? null;

  return (
    <>
      <PaymentMethodPicker
        value={effective}
        onChange={setMethod}
        available={available}
        settings={settings}
        amount={amount}
        locked={hasProof}
      />

      <div className="mt-5">
        <ProofUploadCard
          paymentId={paymentId}
          periodLabel={periodLabel}
          hasProof={hasProof}
          method={effective}
          methodLabel={effective ? getPaymentMethodLabel(effective) : ""}
        />
      </div>
    </>
  );
}