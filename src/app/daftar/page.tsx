import type { Metadata } from "next";
import AuthPanel from "@/components/AuthPanel";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Daftar - SwimmingCourse",
  description: "Buat akun SwimmingCourse untuk mengikuti kursus renang.",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white lg:flex-row">
      <AuthPanel
        heading="Mulai bersama SwimmingCourse"
        description="Daftar untuk mengikuti kursus renang dan mengelola jadwal Anda di Hotel Pelangi, Tanjungpinang."
      />
      <RegisterForm />
    </main>
  );
}