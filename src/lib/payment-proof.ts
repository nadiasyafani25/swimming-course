/**
 * Aturan berkas bukti pembayaran.
 *
 * Proyek ini belum punya object storage, jadi bukti bayar dikirim dari browser
 * sebagai data URL (base64) lalu disimpan apa adanya di `payments.proof_url`
 * yang bertipe `text`. Modul ini dipakai bersama oleh komponen unggah peserta
 * dan route API-nya supaya validasi di browser dan di server tidak pernah
 * berbeda — daftar MIME dan batas ukuran hanya boleh ada di satu tempat.
 *
 * Batas 3 MB dipilih karena bukti bayar umumnya screenshot atau foto transfer
 * yang di bawah 1 MB, sementara Vercel membatasi payload request/response
 * serverless function di 4,5 MB dan membalas 413 di atas itu. Berkas dikirim
 * sebagai base64 di dalam JSON, yang menambah sekitar 33 persen, jadi 3 MB di
 * disk menjadi sekitar 4 MB di kabel — masih di bawah plafon, sementara 5 MB
 * menjadi sekitar 6,7 MB dan pasti ditolak platform sebelum kode server pernah
 * sampai ke validasi di bawah.
 */

/** Batas ukuran berkas bukti bayar, dalam byte. */
export const MAX_PAYMENT_PROOF_BYTES = 3 * 1024 * 1024;

const ALLOWED_PAYMENT_PROOF_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Isi atribut `accept` pada input berkas. */
export const PAYMENT_PROOF_ACCEPT = ALLOWED_PAYMENT_PROOF_TYPES.join(",");

export function isAllowedPaymentProofType(type: string): boolean {
  return (ALLOWED_PAYMENT_PROOF_TYPES as readonly string[]).includes(type);
}

/** "1,4 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export type ParsedProof = {
  mimeType: string;
  bytes: Uint8Array;
};

/**
 * Pecah data URL menjadi tipe MIME dan byte asli.
 *
 * Mengembalikan null kalau string bukan data URL base64 yang sah. Batas ukuran
 * dihitung dari byte hasil decode, bukan dari panjang string: base64 menambah
 * sekitar 33 persen, jadi pendekatan `length * 3 / 4` bisa lolos dari batas
 * padahal berkasnya lebih besar. `atob` dipakai supaya modul ini tetap bisa
 * diimpor komponen client — `Buffer` hanya ada di Node.
 */
export function parseProofDataUrl(value: string): ParsedProof | null {
  const header = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.*)$/i.exec(value);
  if (!header) return null;

  const binary = atob(header[2]);

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return { mimeType: header[1].toLowerCase(), bytes };
}