import { revalidatePath } from "next/cache";

/**
 * Halaman yang menampilkan hasil perubahan jadwal.
 *
 * Dipanggil setiap kali sesi ditambah, diubah, atau dinonaktifkan supaya
 * "Jadwal saya" dan kartu "Sesi berikutnya" di dashboard peserta langsung ikut
 * berubah, bukan menunggu peserta me-refresh halaman.
 */
export function revalidateScheduleViews() {
  revalidatePath("/admin/jadwal");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jadwal");
}