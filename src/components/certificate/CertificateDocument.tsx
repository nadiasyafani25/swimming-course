import {
  certificateSize,
  parseCompetencies,
  type CertificateDraft,
  type CertificateOrientation,
} from "@/lib/certificate-fields";
import { formatDateLong } from "@/admin/time";

/**
 * Dokumen sertifikat A4 dalam orientasi potrait maupun landscape.
 *
 * Komponen ini murni tampilan - tanpa "use client" - supaya bisa dipakai
 * bareng oleh preview admin maupun proses unduhan.
 *
 * Semua gaya memakai inline style, bukan kelas Tailwind, karena dokumen ini
 * dirasterisasi lewat `html-to-image` (SVG foreignObject). Inline style tidak
 * bergantung pada stylesheet yang harus di-inline, jadi hasilnya konsisten
 * di browser maupun di hasil unduhan. Ornamen juga digambar sebagai inline SVG
 * dengan warna solid, menghindari `background-clip: text` dan gradient
 * bertingkat yang sering rusak saat rasterisasi.
 *
 * Landscape hanya mengubah angka di `METRICS` dan perbandingan lebar kolom
 * bawah - urutan dan isi bloknya sama persis dengan potrait, supaya kedua
 * orientasi tidak pernah menampilkan data yang berbeda.
 */

const COLORS = {
  navy: "#0A3966",
  navyDark: "#062C4E",
  blue: "#368DDF",
  blueSoft: "#D8ECFC",
  bluePale: "#EFF7FE",
  gold: "#C9A227",
  goldDark: "#8B6914",
  goldPale: "#FBF3DC",
  ink: "#1B2A3D",
  muted: "#5B6B7F",
  white: "#FFFFFF",
} as const;

const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SANS = "Inter, ui-sans-serif, system-ui, sans-serif";

/**
 * Angka tata letak per orientasi.
 *
 * Landscape tidak bisa memakai ukuran potrait karena ruang vertikalnya hanya
 * 794 px (potrait 1123 px). Semua angka yang lebih besar dari versi potrait
 * diturunkan di sini supaya blok tetap muat di dalam bingkai.
 */
const METRICS = {
  portrait: {
    padding: "36px 74px 44px",
    identityFontSize: 25,
    metaFontSize: 9.5,
    titleFontSize: 44,
    titleMargin: 52,
    titleTracking: 3,
    dividerWidth: 190,
    dividerMargin: 14,
    labelFontSize: 12,
    badgeMinWidth: 420,
    badgeFontSize: 27,
    badgePadding: "13px 26px",
    bodyFontSize: 12.5,
    sectionDividerMargin: 26,
    rowGap: 34,
    competencyFlex: "1 1 58%",
    signatureFlex: "0 0 38%",
    medalScale: 1,
    medalPaddingTop: 16,
  },
  landscape: {
    padding: "34px 66px 40px",
    identityFontSize: 23,
    metaFontSize: 9,
    titleFontSize: 34,
    titleMargin: 32,
    titleTracking: 2,
    dividerWidth: 160,
    dividerMargin: 12,
    labelFontSize: 11,
    badgeMinWidth: 560,
    badgeFontSize: 23,
    badgePadding: "10px 24px",
    bodyFontSize: 12,
    sectionDividerMargin: 18,
    rowGap: 40,
    competencyFlex: "1 1 62%",
    signatureFlex: "0 0 34%",
    medalScale: 0.76,
    medalPaddingTop: 12,
  },
} as const;

type Metrics = (typeof METRICS)[CertificateOrientation];

type CertificateDocumentProps = {
  draft: CertificateDraft;
  orientation?: CertificateOrientation;
  /** Gaya tambahan untuk elemen pembungkus, mis. saat di-scale untuk preview. */
  style?: React.CSSProperties;
  className?: string;
};

/** Tanggal YYYY-MM-DD -> "15 Juli 2026", atau "-" kalau kosong. */
function fmtDate(value: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return formatDateLong(parsed);
}

function orDash(value: string): string {
  const trimmed = value.trim();
  return trimmed || "-";
}

/**
 * Kepadatan daftar kompetensi, menyesuaikan jumlah butir.
 *
 * Space vertikal di landscape hanya 794 px, jadi daftar yang panjang harus
 * dirapatkan. Tanpa penyesuaian ini, butir terakhir akan keluar dari halaman
 * dan terpotong oleh `overflow: hidden`.
 */
function listDensity(count: number): {
  lineHeight: number;
  itemMargin: number;
} {
  if (count <= 4) return { lineHeight: 1.9, itemMargin: 2 };
  if (count <= 6) return { lineHeight: 1.65, itemMargin: 1 };
  if (count <= 9) return { lineHeight: 1.5, itemMargin: 0 };
  return { lineHeight: 1.4, itemMargin: 0 };
}

/**
 * Gelombang laut dekoratif di sisi atas.
 *
 * Path memakai viewBox 1000px lalu diregangkan ke lebar halaman, jadi
 * koordinat cukup untuk potrait (794) maupun landscape (1123). Gelombang
 * memang murni dekoratif sehingga peregangan horizontalnya tidak terlihat.
 */
function TopWaves({ width }: { width: number }) {
  return (
    <svg
      width={width}
      height={150}
      viewBox="0 0 1000 150"
      preserveAspectRatio="none"
      style={{ position: "absolute", top: 0, left: 0 }}
      aria-hidden="true"
    >
      {/* Gelombang paling dalam */}
      <path
        d="M0,0 H1000 V118 C856,132 746,108 630,124 C529,138 417,120 303,130 C189,140 76,120 0,134 Z"
        fill={COLORS.navy}
      />
      {/* Gelombang biru muda */}
      <path
        d="M0,0 H1000 V108 C856,122 746,98 630,114 C529,128 417,110 303,120 C189,130 76,112 0,124 Z"
        fill={COLORS.blue}
        opacity="0.7"
      />
      {/*
        Tab biru muda melengkung untuk identitas lembaga. Digambar paling akhir
        supaya menutupi gelombang di atasnya dan menyisakan ruang kosong yang
        lega untuk logo, kontak, dan situs web.

        Tepi bawah tab berada di y=100 sampai 118 pada skala 1000px; teks
        identitas berakhir jauh di atas itu sehingga tidak pernah bertumpuk.
      */}
      <path
        d="M0,0 H1000 V100 C856,112 746,94 630,106 C529,120 417,104 303,114 C189,124 76,106 0,118 Z"
        fill={COLORS.blueSoft}
      />
      <path
        d="M0,140 C88,128 161,150 247,142 C333,134 393,116 480,122 C566,128 630,146 713,140 C796,134 868,120 932,126 C961,129 983,133 1000,136 L1000,150 L0,150 Z"
        fill={COLORS.bluePale}
      />
    </svg>
  );
}

/** Gelombang laut dekoratif di sisi bawah sertifikat. */
function BottomWaves({ width }: { width: number }) {
  return (
    <svg
      width={width}
      height={150}
      viewBox="0 0 1000 150"
      preserveAspectRatio="none"
      style={{ position: "absolute", bottom: 0, left: 0 }}
      aria-hidden="true"
    >
      <path
        d="M0,150 L1000,150 L1000,86 C856,48 746,120 630,92 C529,68 417,42 303,66 C189,91 76,130 0,106 Z"
        fill={COLORS.navy}
      />
      <path
        d="M0,150 L1000,150 L1000,116 C856,96 746,132 630,120 C529,108 417,84 303,98 C189,112 76,138 0,124 Z"
        fill={COLORS.blue}
        opacity="0.7"
      />
      <path
        d="M0,32 C88,46 161,18 247,26 C333,34 393,58 480,52 C566,46 630,22 713,28 C796,34 868,54 932,48 C961,45 983,40 1000,36 L1000,0 L0,0 Z"
        fill={COLORS.bluePale}
      />
    </svg>
  );
}

/** Medal emas dengan pita, untuk sudut kiri bawah. */
function GoldSeal() {
  const star = Array.from({ length: 10 }, (_, i) => {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? 13 : 5.6;
    return `${48 + radius * Math.cos(angle)},${74 + radius * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg width="96" height="104" viewBox="0 0 96 104" aria-hidden="true">
      <path d="M26,4 L44,4 L50,58 L34,58 Z" fill={COLORS.goldDark} />
      <path d="M52,4 L70,4 L62,58 L46,58 Z" fill={COLORS.gold} />
      <circle cx="48" cy="74" r="27" fill={COLORS.gold} />
      <circle
        cx="48"
        cy="74"
        r="27"
        fill="none"
        stroke={COLORS.goldDark}
        strokeWidth="2.5"
      />
      <circle
        cx="48"
        cy="74"
        r="21"
        fill="none"
        stroke={COLORS.goldDark}
        strokeWidth="1.2"
        opacity="0.7"
      />
      <polygon points={star} fill={COLORS.goldDark} />
    </svg>
  );
}

export default function CertificateDocument({
  draft,
  orientation = "portrait",
  style,
  className,
}: CertificateDocumentProps) {
  const size = certificateSize(orientation);
  const m: Metrics = METRICS[orientation];
  const competencies = parseCompetencies(draft.competencies);
  const density = listDensity(competencies.length);
  // Space vertikal di potrait lega, di landscape sempit. Daftar yang sudah mulai
  // panjang dipecah dua kolom supaya tidak menabrak medal di bawah. Ambang 5
  // dipilih supaya landscape punya sisa ruang yang aman, bukan pas-pasan.
  const competencyColumns = competencies.length > 5 ? 2 : 1;

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size.width,
        height: size.height,
        backgroundColor: COLORS.white,
        overflow: "hidden",
        fontFamily: FONT_SANS,
        color: COLORS.ink,
        ...style,
      }}
    >
      <TopWaves width={size.width} />
      <BottomWaves width={size.width} />

      {/* Bingkai ganda yang cris */}
      <div
        style={{
          position: "absolute",
          top: 22,
          left: 22,
          right: 22,
          bottom: 22,
          border: `3px solid ${COLORS.navy}`,
          borderRadius: 10,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 32,
          right: 32,
          bottom: 32,
          border: `1px solid ${COLORS.blue}`,
          borderRadius: 6,
        }}
      />

      {/* Isi sertifikat */}
      <div
        style={{
          position: "relative",
          height: "100%",
          padding: m.padding,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header: identitas lembaga, duduk di dalam tab biru muda */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontFamily: FONT_SERIF,
              fontSize: m.identityFontSize,
              fontWeight: "bold",
              letterSpacing: "0.5px",
              color: COLORS.navyDark,
              lineHeight: 1.1,
            }}
          >
            {orDash(draft.organizationName)}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: m.metaFontSize,
              letterSpacing: "0.4px",
              color: COLORS.muted,
            }}
          >
            {orDash(draft.organizationContact)}
          </div>
          <div
            style={{
              marginTop: 1,
              fontSize: m.metaFontSize,
              letterSpacing: "0.4px",
              color: COLORS.muted,
            }}
          >
            {orDash(draft.organizationWebsite)}
          </div>
        </div>

        {/* Judul */}
        <h1
          style={{
            margin: `${m.titleMargin}px 0 0`,
            fontFamily: FONT_SERIF,
            fontSize: m.titleFontSize,
            fontWeight: "bold",
            letterSpacing: `${m.titleTracking}px`,
            textAlign: "center",
            color: COLORS.navy,
            lineHeight: 1.15,
          }}
        >
          SERTIFIKAT KELULUSAN
        </h1>

        <div
          style={{
            width: m.dividerWidth,
            height: 2,
            margin: `${m.dividerMargin}px auto 0`,
            backgroundColor: COLORS.gold,
          }}
        />

        {/* Nomor sertifikat */}
        <p
          style={{
            margin: "18px 0 0",
            textAlign: "center",
            fontSize: m.bodyFontSize,
            color: COLORS.muted,
          }}
        >
          No. Sertifikat:{" "}
          <span style={{ fontWeight: "bold", color: COLORS.ink }}>
            {orDash(draft.certificateNo)}
          </span>
        </p>

        <p
          style={{
            margin: "16px 0 0",
            textAlign: "center",
            fontSize: m.bodyFontSize,
            color: COLORS.muted,
          }}
        >
          Sertifikat ini secara resmi diberikan kepada:
        </p>

        {/* Kotak nama murid */}
        <div
          style={{
            margin: "12px auto 0",
            minWidth: m.badgeMinWidth,
            maxWidth: "92%",
            padding: m.badgePadding,
            textAlign: "center",
            border: `2px solid ${COLORS.gold}`,
            borderRadius: 8,
            backgroundColor: COLORS.goldPale,
          }}
        >
          <span
            style={{
              fontFamily: FONT_SERIF,
              fontSize: m.badgeFontSize,
              fontWeight: "bold",
              letterSpacing: "1px",
              color: COLORS.ink,
              lineHeight: 1.2,
            }}
          >
            {orDash(draft.studentName).toUpperCase()}
          </span>
        </div>

        <p
          style={{
            margin: "18px 0 0",
            textAlign: "center",
            fontSize: m.bodyFontSize,
            lineHeight: 1.75,
            color: COLORS.muted,
          }}
        >
          Atas kelulusan dan keberhasilannya dalam menyelesaikan program
          pelatihan renang:
        </p>

        {/* Tingkat / level */}
        <p
          style={{
            margin: "8px 0 0",
            textAlign: "center",
            fontFamily: FONT_SERIF,
            fontSize: 21,
            fontWeight: "bold",
            letterSpacing: "0.6px",
            color: COLORS.goldDark,
            lineHeight: 1.3,
          }}
        >
          {orDash(draft.level)}
        </p>

        {draft.programName.trim() && (
          <p
            style={{
              margin: "5px 0 0",
              textAlign: "center",
              fontSize: m.bodyFontSize - 1,
              color: COLORS.muted,
            }}
          >
            Program {draft.programName.trim()}
          </p>
        )}

        {/* Tanggal dan lokasi */}
        <p
          style={{
            margin: "10px 0 0",
            textAlign: "center",
            fontSize: m.bodyFontSize,
            lineHeight: 1.75,
            color: COLORS.muted,
          }}
        >
          yang diselenggarakan pada {fmtDate(draft.startDate)} hingga{" "}
          {fmtDate(draft.endDate)} di {orDash(draft.locationName)}.
        </p>

        <div
          style={{
            width: 120,
            height: 1,
            margin: `${m.sectionDividerMargin}px auto 0`,
            backgroundColor: "#C9D8E6",
          }}
        />

        {/* Kompetensi dan tanda tangan */}
        <div
          style={{
            display: "flex",
            gap: m.rowGap,
            marginTop: m.sectionDividerMargin,
            alignItems: "flex-start",
          }}
        >
          {/* Kolom kiri: kompetensi */}
          <div style={{ flex: m.competencyFlex }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="22" height="16" viewBox="0 0 22 16" aria-hidden="true">
                <path
                  d="M0,9 C3,4 6,4 9,9 C12,14 15,14 18,9 C20,5 21,5 22,6 L22,11 C20,10 19,11 18,12 C15,16 12,16 9,11 C6,6 3,6 0,11 Z"
                  fill={COLORS.blue}
                />
              </svg>
              <span
                style={{
                  fontSize: m.labelFontSize,
                  fontWeight: "bold",
                  color: COLORS.navy,
                }}
              >
                Murid telah menguasai kompetensi dasar meliputi:
              </span>
            </div>

            <ul
              style={{
                margin: "12px 0 0",
                paddingLeft: 18,
                fontSize: m.bodyFontSize - 1,
                lineHeight: density.lineHeight,
                color: COLORS.ink,
                columnCount: competencyColumns,
                columnGap: 20,
              }}
            >
              {competencies.length === 0 ? (
                <li style={{ color: COLORS.muted }}>-</li>
              ) : (
                competencies.map((item) => (
                  <li key={item} style={{ marginBottom: density.itemMargin }}>
                    {item}
                  </li>
                ))
              )}
            </ul>

            <p
              style={{
                margin: "22px 0 0",
                fontSize: m.bodyFontSize - 1,
                lineHeight: 1.8,
                color: COLORS.muted,
              }}
            >
              Diberikan di {orDash(draft.issueCity)}, pada tanggal{" "}
              {fmtDate(draft.issueDate)}.
            </p>
          </div>

          {/* Kolom kanan: tanda tangan */}
          <div
            style={{
              flex: m.signatureFlex,
              textAlign: "center",
              paddingTop: 6,
            }}
          >
            <p
              style={{ margin: 0, fontSize: m.bodyFontSize - 1, color: COLORS.muted }}
            >
              {orDash(draft.issueCity)}, {fmtDate(draft.issueDate)}
            </p>

            <div
              style={{
                marginTop: 46,
                borderBottom: `1.5px solid ${COLORS.ink}`,
                height: 1,
              }}
            />

            <p
              style={{
                margin: "7px 0 0",
                fontSize: m.metaFontSize,
                color: COLORS.muted,
              }}
            >
              Tanda Tangan
            </p>

            <p
              style={{
                margin: "26px 0 0",
                fontFamily: FONT_SERIF,
                fontSize: 15,
                fontWeight: "bold",
                color: COLORS.navy,
                lineHeight: 1.3,
              }}
            >
              {orDash(draft.coachName)}
            </p>

            <p
              style={{
                margin: "4px 0 0",
                fontSize: m.metaFontSize,
                color: COLORS.muted,
              }}
            >
              {orDash(draft.coachTitle)}
            </p>
          </div>
        </div>

        {/* Medal di sudut kiri bawah */}
        <div style={{ marginTop: "auto", paddingTop: m.medalPaddingTop }}>
          <div
            style={{
              width: 96 * m.medalScale,
              height: 104 * m.medalScale,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                transform: `scale(${m.medalScale})`,
                transformOrigin: "top left",
              }}
            >
              <GoldSeal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
