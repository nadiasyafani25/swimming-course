const photos = [
  { id: "Foto 1", large: true },
  { id: "Foto 2" },
  { id: "Foto 3" },
  { id: "Foto 4" },
  { id: "Foto 5" },
  { id: "Foto 6" },
  { id: "Foto 7" },
];

export default function GallerySection() {
  return (
    <section className="w-full bg-[#F3F8FD]">
      <div className="mx-auto max-w-[1100px] px-5 pb-24 pt-16">
        {/* Label */}
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.1em] text-[#368DDF]">
          Galeri
        </p>

        {/* Heading */}
        <h1 className="mt-3 text-center text-[26px] font-bold leading-snug text-[#073763] lg:text-[28px]">
          Momen kegiatan di kolam
        </h1>

        {/* Grid foto */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`flex items-center justify-center rounded-lg border border-[#D6E5F3] bg-[#B8D5F2] ${
                photo.large
                  ? "h-[260px] lg:row-span-2 lg:h-auto lg:min-h-[258px]"
                  : "h-[123px]"
              }`}
            >
              <span className="text-sm font-medium text-[#073763]/70">
                {photo.id}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}