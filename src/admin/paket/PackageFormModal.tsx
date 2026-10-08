"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AGE_GROUPS, formatPriceLabel } from "@/lib/course-format";
import type { CoursePackageRow } from "@/admin/types";

type Errors = Partial<
  Record<
    | "name"
    | "priceMonthly"
    | "priceLabel"
    | "priceUnit"
    | "capacityLabel"
    | "ageGroups"
    | "durationSessions"
    | "coachName"
    | "description",
    string
  >
>;

type PackageFormModalProps = {
  mode: "create" | "edit";
  packageRow: CoursePackageRow | null;
  coachNames: string[];
  onClose: () => void;
  onSaved: () => void;
};

const emptyForm = {
  name: "",
  capacityLabel: "",
  priceMonthly: "",
  priceLabel: "",
  priceUnit: "/ peserta / bulan",
  description: "",
  coachName: "",
  durationSessions: "8",
};

export default function PackageFormModal({
  mode,
  packageRow,
  coachNames,
  onClose,
  onSaved,
}: PackageFormModalProps) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState(() =>
    packageRow
      ? {
          name: packageRow.name,
          capacityLabel: packageRow.capacityLabel,
          priceMonthly: String(packageRow.priceMonthly),
          // priceLabel bisa hasil format otomatis, bukan nilai yang diketik
          // admin. Mengosongkan kolom ini berarti "pakai format otomatis".
          priceLabel: packageRow.priceLabel === formatPriceLabel(packageRow.priceMonthly)
            ? ""
            : packageRow.priceLabel,
          priceUnit: packageRow.priceUnit,
          description: packageRow.description ?? "",
          coachName: packageRow.coachName,
          durationSessions: String(packageRow.durationSessions),
        }
      : emptyForm,
  );
  const [ageGroups, setAgeGroups] = useState<string[]>(
    packageRow?.ageGroups ?? [],
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const setField = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleAgeGroup = (key: string) => {
    setAgeGroups((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
    setErrors((prev) => ({ ...prev, ageGroups: undefined }));
  };

  const pricePreview =
    form.priceMonthly.replace(/[^\d]/g, "") !== ""
      ? formatPriceLabel(Number(form.priceMonthly.replace(/[^\d]/g, "")))
      : "Rp 0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    if (!form.name.trim()) next.name = "Nama paket wajib diisi.";
    if (!form.capacityLabel.trim()) {
      next.capacityLabel = "Label kapasitas wajib diisi.";
    }
    if (!form.priceUnit.trim()) {
      next.priceUnit = "Satuan harga wajib diisi.";
    }
    if (form.priceMonthly.replace(/[^\d]/g, "") === "") {
      next.priceMonthly = "Harga bulanan wajib diisi dengan angka.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);

    try {
      const res = await fetch(
        isEdit ? `/api/admin/packages/${packageRow?.id}` : "/api/admin/packages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, ageGroups }),
        },
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const field = data?.field as keyof Errors | undefined;
        setErrors({ [field ?? "name"]: data?.error ?? "Gagal menyimpan paket." });
        return;
      }

      onSaved();
    } catch {
      setErrors({ name: "Gagal menghubungi server." });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (error?: string) =>
    `w-full rounded-lg border px-3 text-[12px] text-[#073763] outline-none transition-colors placeholder:text-[#A9BACB] focus:border-[#2F8FE5] ${
      error ? "border-red-400" : "border-[#D6E5F3]"
    } bg-white`;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A2540]/50 px-4 py-6"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="package-form-title"
        className="max-h-full w-full max-w-[520px] overflow-y-auto rounded-xl border border-[#D6E5F3] bg-white p-5 shadow-[0_12px_32px_rgba(10,37,64,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="package-form-title"
              className="text-[15px] font-bold text-[#073763]"
            >
              {isEdit ? "Ubah paket kursus" : "Tambah paket kursus"}
            </h3>
            <p className="mt-1 text-[11px] leading-[1.6] text-[#526B84]">
              Semua perubahan langsung tampil di katalog kursus peserta.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Tutup"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#526B84] transition-colors hover:bg-[#F0F7FF] disabled:opacity-60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-5 flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Nama paket
            </span>
            <input
              type="text"
              value={form.name}
              placeholder="Contoh: Kelas reguler"
              onChange={(e) => setField("name")(e.target.value)}
              className={`${inputClass(errors.name)} h-[36px]`}
            />
            {errors.name && (
              <span className="mt-1 block text-[10px] text-red-500">
                {errors.name}
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Label kapasitas
            </span>
            <input
              type="text"
              value={form.capacityLabel}
              placeholder="Contoh: Tanpa batasan peserta"
              onChange={(e) => setField("capacityLabel")(e.target.value)}
              className={`${inputClass(errors.capacityLabel)} h-[36px]`}
            />
            {errors.capacityLabel && (
              <span className="mt-1 block text-[10px] text-red-500">
                {errors.capacityLabel}
              </span>
            )}
          </label>

          <div className="grid gap-3.5 sm:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Harga bulanan
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={form.priceMonthly}
                placeholder="350000"
                onChange={(e) => setField("priceMonthly")(e.target.value)}
                className={`${inputClass(errors.priceMonthly)} h-[36px]`}
              />
              <span className="mt-1 block text-[10px] text-[#A9BACB]">
                Dipakai untuk tagihan. Tampil: {pricePreview}
              </span>
              {errors.priceMonthly && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.priceMonthly}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Satuan harga
              </span>
              <input
                type="text"
                value={form.priceUnit}
                placeholder="/ peserta / bulan"
                onChange={(e) => setField("priceUnit")(e.target.value)}
                className={`${inputClass(errors.priceUnit)} h-[36px]`}
              />
              {errors.priceUnit && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.priceUnit}
                </span>
              )}
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Teks harga tampilan{" "}
              <span className="font-normal text-[#A9BACB]">(opsional)</span>
            </span>
            <input
              type="text"
              value={form.priceLabel}
              placeholder="Kosongkan untuk format otomatis"
              onChange={(e) => setField("priceLabel")(e.target.value)}
              className={`${inputClass(errors.priceLabel)} h-[36px]`}
            />
            <span className="mt-1 block text-[10px] text-[#A9BACB]">
              Untuk harga rentang, contoh: Rp 1,5jt - 3jt
            </span>
          </label>

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Kelompok usia
            </span>
            <div className="flex gap-2">
              {AGE_GROUPS.map((group) => {
                const active = ageGroups.includes(group.key);
                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() => toggleAgeGroup(group.key)}
                    aria-pressed={active}
                    className={`h-[32px] rounded-lg px-3.5 text-[11px] font-semibold transition-colors ${
                      active
                        ? "bg-[#0A3966] text-white"
                        : "border border-[#D6E5F3] bg-white text-[#526B84] hover:border-[#368DDF]"
                    }`}
                  >
                    {group.label}
                  </button>
                );
              })}
            </div>
            {errors.ageGroups && (
              <span className="mt-1 block text-[10px] text-red-500">
                {errors.ageGroups}
              </span>
            )}
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Target sesi
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={form.durationSessions}
                onChange={(e) => setField("durationSessions")(e.target.value)}
                className={`${inputClass(errors.durationSessions)} h-[36px]`}
              />
              {errors.durationSessions && (
                <span className="mt-1 block text-[10px] text-red-500">
                  {errors.durationSessions}
                </span>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
                Pelatih
              </span>
              <input
                type="text"
                list="coach-name-options"
                value={form.coachName}
                placeholder="Nama pelatih"
                onChange={(e) => setField("coachName")(e.target.value)}
                className={`${inputClass(errors.coachName)} h-[36px]`}
              />
              <datalist id="coach-name-options">
                {coachNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#073763]">
              Deskripsi <span className="font-normal text-[#A9BACB]">(opsional)</span>
            </span>
            <textarea
              rows={2}
              value={form.description}
              placeholder="Penjelasan singkat paket"
              onChange={(e) => setField("description")(e.target.value)}
              className={`${inputClass(errors.description)} resize-none py-2 leading-[1.6]`}
            />
          </label>

          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="h-[38px] flex-1 rounded-lg border border-[#D6E5F3] text-[12px] font-semibold text-[#526B84] transition-colors hover:border-[#368DDF] hover:text-[#073763] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-[38px] flex-1 rounded-lg bg-[#0A3966] text-[12px] font-semibold text-white transition-colors hover:bg-[#0A2540] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan perubahan"
                  : "Tambah paket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}