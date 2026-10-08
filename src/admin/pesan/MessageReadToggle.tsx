"use client";

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MailOpen } from "lucide-react";

type MessageReadToggleProps = {
  id: string;
  isRead: boolean;
};

export default function MessageReadToggle({
  id,
  isRead,
}: MessageReadToggleProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: !isRead }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      title={isRead ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
      aria-label={isRead ? "Tandai belum dibaca" : "Tandai sudah dibaca"}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-[#D6E5F3] bg-white text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isRead ? (
        <MailOpen className="h-3.5 w-3.5" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
    </button>
  );
}