"use client";

import { useRouter } from "next/navigation";
import ArchiveConfirmModal from "@/admin/shared/ArchiveConfirmModal";
import type { ParticipantRow } from "@/admin/types";

type ArchiveParticipantModalProps = {
  participant: ParticipantRow;
  onClose: () => void;
  onDone: () => void;
};

export default function ArchiveParticipantModal({
  participant,
  onClose,
  onDone,
}: ArchiveParticipantModalProps) {
  const router = useRouter();

  const toggle = async () => {
    try {
      const res = await fetch(`/api/admin/participants/${participant.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !participant.isActive }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        return { ok: false, error: data?.error ?? "Gagal mengubah status peserta." };
      }

      onDone();
      router.refresh();
      return { ok: true };
    } catch {
      return { ok: false, error: "Gagal menghubungi server." };
    }
  };

  return (
    <ArchiveConfirmModal
      subject={`${participant.firstName} ${participant.lastName}`}
      isActive={participant.isActive}
      noun="peserta"
      body={
        participant.isActive
          ? "tidak akan bisa login lagi dan langsung kehilangan sesi aktifnya. Data kursus, pembayaran, dan sertifikatnya tetap disimpan."
          : "akan bisa login lagi seperti semula."
      }
      onClose={onClose}
      onConfirm={toggle}
    />
  );
}