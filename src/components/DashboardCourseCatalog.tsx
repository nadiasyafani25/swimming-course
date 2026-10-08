"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AGE_GROUPS, type AgeGroup } from "@/lib/course-format";
import CourseEnrollModal from "@/components/CourseEnrollModal";
import type { CatalogCourse } from "@/admin/types";

type DashboardCourseCatalogProps = {
  userName: string;
  userEmail: string;
  userPhone: string;
  courses: CatalogCourse[];
};

export default function DashboardCourseCatalog({
  userName,
  userEmail,
  userPhone,
  courses,
}: DashboardCourseCatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<AgeGroup | "semua">("semua");
  const [selectedCourse, setSelectedCourse] = useState<CatalogCourse | null>(null);

  const categoryOptions: { key: AgeGroup | "semua"; label: string }[] = [
    { key: "semua", label: "Semua" },
    ...AGE_GROUPS.map((group) => ({ key: group.key, label: group.label })),
  ];

  const visibleCourses = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesCategory =
        category === "semua" || course.categories.includes(category);
      const matchesKeyword =
        keyword.length === 0 ||
        course.title.toLowerCase().includes(keyword) ||
        course.badge.toLowerCase().includes(keyword) ||
        course.price.toLowerCase().includes(keyword);

      return matchesCategory && matchesKeyword;
    });
  }, [courses, query, category]);

  return (
    <>
      <div className="flex flex-col gap-[14px]">
        {/* Pencarian + filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-[280px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8FA3B8]"
              aria-hidden="true"
            />
            <input
              id="course-search"
              type="search"
              placeholder="Cari nama kursus..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Cari nama kursus"
              className="h-[34px] w-full rounded-md border border-[#D6E5F3] bg-white pl-9 pr-3 text-[11px] text-[#073763] outline-none transition-colors placeholder:text-[#8FA3B8] focus:border-[#2F8FE5]"
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter kategori kursus"
          >
            {categoryOptions.map((item) => {
              const isActive = category === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key)}
                  aria-pressed={isActive}
                  className={`h-[34px] rounded-md px-3.5 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? "border border-[#368DDF] bg-[#E5F1FC] text-[#1769AA]"
                      : "border border-[#D6E5F3] bg-white text-[#526B84] hover:border-[#368DDF] hover:text-[#1769AA]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid kartu */}
        {visibleCourses.length > 0 ? (
          <div className="grid gap-[18px] sm:grid-cols-2 xl:grid-cols-3">
            {visibleCourses.map((course) => (
              <article
                key={course.slug}
                className="flex flex-col overflow-hidden rounded-[10px] border border-[#D6E5F3] bg-white shadow-[0_1px_3px_rgba(7,55,99,0.06)] transition-shadow hover:shadow-[0_4px_14px_rgba(7,55,99,0.10)]"
              >
                <div className="flex h-[120px] items-center justify-center bg-[#E5F1FC]">
                  {/* Placeholder: belum ada aset gambar di project ini. */}
                  <span className="text-[11px] font-medium text-[#8FA3B8]">
                    Foto kursus
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <span className="self-start rounded-full bg-[#E5F1FC] px-2.5 py-1 text-[10px] font-semibold text-[#1769AA]">
                    {course.badge}
                  </span>

                  <h2 className="mt-2.5 text-[14px] font-bold text-[#073763]">
                    {course.title}
                  </h2>
                  <p className="mt-1 text-[11px] text-[#8FA3B8]">{course.price}</p>

                  <div className="mt-4 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCourse(course)}
                      className="h-[34px] w-full rounded-md border border-[#D6E5F3] bg-[#E5F1FC] text-[11px] font-semibold text-[#1769AA] transition-colors hover:border-[#368DDF] hover:bg-[#D6E5F3]"
                    >
                      Daftar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-[10px] border border-dashed border-[#D6E5F3] bg-white px-5 py-12 text-center">
            <p className="text-[12px] font-semibold text-[#526B84]">
              Kursus tidak ditemukan
            </p>
            <p className="mt-1 text-[11px] text-[#8FA3B8]">
              Coba kata kunci lain atau pilih filter &quot;Semua&quot;.
            </p>
          </div>
        )}
      </div>

      {selectedCourse && (
        <CourseEnrollModal
          open
          courseTitle={selectedCourse.title}
          defaultName={userName}
          defaultEmail={userEmail}
          defaultPhone={userPhone}
          onClose={() => setSelectedCourse(null)}
        />
      )}
    </>
  );
}