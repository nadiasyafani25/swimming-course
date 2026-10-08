"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type DeleteMessageButtonProps = {
  id: string;
  name: string;
};

export default function DeleteMessageButton({
  id,
  name,
}: DeleteMessageButtonProps) {
  const router = useRouter();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isConfirmOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsConfirmOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirmOpen]);

  const confirmDelete = async () => {
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(body?.error ?? "Gagal menghapus pesan.");
      }
    } catch {
      setError("Gagal menghubungi server.");
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsConfirmOpen(true);
        }}
        disabled={isDeleting}
        aria-haspopup="dialog"
        aria-label={`Hapus pesan dari ${name}`}
        title="Hapus pesan"
        className="flex h-7 w-7 items-center justify-center rounded-md border border-[#D6E5F3] bg-white text-[#526B84] transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
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
            aria-labelledby="delete-message-title"
            className="w-full max-w-[360px] rounded-[10px] border border-[#D6E5F3] bg-white p-5 shadow-[0_8px_24px_rgba(7,55,99,0.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-4 w-4 text-red-500" />
              </span>
              <div className="min-w-0">
                <h3
                  id="delete-message-title"
                  className="text-[14px] font-bold text-[#073763]"
                >
                  Hapus pesan ini?
                </h3>
                <p className="mt-1 text-[11px] leading-[1.7] text-[#526B84]">
                  Pesan dari {name} akan dihapus permanen dan tidak bisa
                  dikembalikan.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-[11px] text-red-600">
                {error}
              </p>
            )}

            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                disabled={isDeleting}
                className="h-[34px] flex-1 rounded-md border border-[#D6E5F3] text-[11px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="h-[34px] flex-1 rounded-md bg-red-600 text-[11px] font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Menghapus..." : "Ya, hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}