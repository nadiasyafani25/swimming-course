"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  pendingLabel?: string;
  iconClassName?: string;
  /**
   * Dialog "Keluar dari akun?" muncul sebelum benar-benar keluar.
   *
   * Panel admin memakai dialog ini: menu logout ada di sidebar yang selalu
   * terlihat, jadi satu klik sudah cukup jelas maksudnya dan dialog hanya
   * menambah satu langkah. Dashboard peserta tetap memakainya karena logout
   * di sana dilakukan dari halaman Profil, jauh dari navigasi utama.
   */
  confirm?: boolean;
};

export default function LogoutButton({
  className = "",
  label = "Keluar",
  pendingLabel = "Keluar...",
  iconClassName = "text-[#8FA3B8]",
  confirm = true,
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isConfirmOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsConfirmOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmOpen]);

  const confirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsLoggingOut(false);
      setIsConfirmOpen(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => (confirm ? setIsConfirmOpen(true) : void confirmLogout())}
        disabled={isLoggingOut}
        aria-haspopup={confirm ? "dialog" : undefined}
        className={`disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <LogOut className={`h-4 w-4 shrink-0 ${iconClassName}`} />
        {isLoggingOut ? pendingLabel : label}
      </button>

      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#062c4e]/40 px-5"
          onClick={() => setIsConfirmOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            className="w-full max-w-[340px] rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_8px_24px_rgba(7,55,99,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
                <LogOut className="h-4 w-4 text-red-500" />
              </span>
              <div className="min-w-0">
                <h3
                  id="logout-confirm-title"
                  className="text-[14px] font-bold text-[#073763]"
                >
                  Keluar dari akun?
                </h3>
                <p className="mt-1 text-[11px] leading-[1.7] text-[#526B84]">
                  Anda perlu masuk kembali dengan email dan kata sandi untuk
                  membuka dashboard.
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isLoggingOut}
                className="h-[34px] flex-1 rounded-md border border-[#D6E5F3] text-[11px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                disabled={isLoggingOut}
                className="h-[34px] flex-1 rounded-md bg-[#0D4D85] text-[11px] font-semibold text-white transition-colors hover:bg-[#0a3f6d] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingOut ? "Keluar..." : "Ya, keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}