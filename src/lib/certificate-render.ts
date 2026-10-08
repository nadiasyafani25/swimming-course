import {
  certificateSize,
  type CertificateOrientation,
} from "./certificate-fields";

/**
 * Rasterisasi dokumen sertifikat menjadi berkas.
 *
 * Ketergantungan `html-to-image` dan `jspdf` sengaja di-import dinamis supaya
 * tidak ikut terbundel di awal halaman admin - keduanya baru dimuat ketika
 * admin benar-benar menekan tombol unduh.
 */

export type CertificateExportFormat = "png" | "jpg" | "pdf";

/** A4 dalam milimeter, dipakai jsPDF. */
const A4_LONG_MM = 297;
const A4_SHORT_MM = 210;

/** Resolusi tangkapan. 3x A4 -> 2382 x 3369 px, cukup untuk dicetak. */
const PIXEL_RATIO = 3;

export function extensionFor(format: CertificateExportFormat): string {
  return format;
}

/** Picu unduhan di browser. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * `html-to-image` hanya punya `toBlob` khusus PNG; JPEG harus lewat data URL
 * lalu dikonversi manual ke Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload] = dataUrl.split(",");
  const mimeMatch = /data:([^;]+);/.exec(header ?? "");
  const mime = mimeMatch?.[1] ?? "image/jpeg";
  const binary = atob(payload ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

/**
 * Ubah node sertifikat menjadi Blob sesuai format yang diminta.
 *
 * PDF dibuat dengan membungkus hasil tangkapan JPEG ke dalam satu halaman A4.
 * JPEG 0.95 membuat PDF jauh lebih kecil daripada PDF berisi gambar PNG mentah,
 * dan declare HTML dokumen ini sudah memakai warna solid tanpa gradient, jadi
 * tidak ada detail halus yang hilang saat dikompresi.
 */
export async function renderCertificate(
  node: HTMLElement,
  format: CertificateExportFormat,
  orientation: CertificateOrientation,
): Promise<Blob> {
  const { toBlob, toJpeg } = await import("html-to-image");
  const size = certificateSize(orientation);

  // Paksa ukuran penuh saat ditangkap: preview di layar sengaja di-scale dan
  // transform itu akan ikut terbawa kalau tidak dikunci di sini.
  const options = {
    width: size.width,
    height: size.height,
    pixelRatio: PIXEL_RATIO,
    cacheBust: true,
    style: { transform: "none", margin: "0" },
  };

  if (format === "pdf") {
    const dataUrl = await toJpeg(node, { ...options, quality: 0.95 });

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({
      orientation: orientation === "landscape" ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    pdf.addImage(
      dataUrl,
      "JPEG",
      0,
      0,
      orientation === "landscape" ? A4_LONG_MM : A4_SHORT_MM,
      orientation === "landscape" ? A4_SHORT_MM : A4_LONG_MM,
      undefined,
      "FAST",
    );

    return pdf.output("blob");
  }

  if (format === "jpg") {
    const dataUrl = await toJpeg(node, { ...options, quality: 0.95 });
    return dataUrlToBlob(dataUrl);
  }

  const blob = await toBlob(node, options);
  if (!blob) {
    throw new Error("Gagal membuat berkas sertifikat.");
  }

  return blob;
}