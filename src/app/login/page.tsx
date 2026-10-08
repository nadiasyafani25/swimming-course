import type { Metadata } from "next";
import AuthPanel from "@/components/AuthPanel";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login - SwimmingCourse",
  description: "Masuk ke akun SwimmingCourse Anda.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-white lg:flex-row">
      <AuthPanel
        heading="Selamat datang kembali"
        description="Masuk untuk melihat jadwal, pembayaran, dan progres kursus renang Anda di Hotel Pelangi, Tanjungpinang."
      />
      <LoginForm />
    </main>
  );
}
