import { Product } from "@/lib/products";

interface CoverMeta {
  coverBg: string;
  coverInk: string;
  shape: string;
}

const SLUG_MAP: Record<string, CoverMeta> = {
  "miko-meets-animals":     { coverBg: "#C9A84C", coverInk: "#0E3B26", shape: "elephant" },
  "miko-celebrates-festivals": { coverBg: "#5B3A6B", coverInk: "#F7F3EC", shape: "diya" },
  "miko-learns-actions":    { coverBg: "#6FA8B8", coverInk: "#0E3B26", shape: "stride" },
  "miko-learns-manners":    { coverBg: "#B86A6A", coverInk: "#F7F3EC", shape: "hands" },
  "gods-and-goddesses":     { coverBg: "#0E3B26", coverInk: "#C9A84C", shape: "lotus" },
  "miko-first-numbers":     { coverBg: "#EFE8D8", coverInk: "#0E3B26", shape: "numbers" },
};

const FALLBACKS: CoverMeta[] = [
  { coverBg: "#0E3B26", coverInk: "#F7F3EC", shape: "lotus" },
  { coverBg: "#C9A84C", coverInk: "#0E3B26", shape: "elephant" },
  { coverBg: "#6FA8B8", coverInk: "#0E3B26", shape: "stride" },
  { coverBg: "#B86A6A", coverInk: "#F7F3EC", shape: "hands" },
];

export function getBookCoverMeta(slug: string): CoverMeta {
  if (SLUG_MAP[slug]) return SLUG_MAP[slug];
  const hash = slug.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACKS[hash % FALLBACKS.length];
}

export function lightenHex(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

interface GlyphProps {
  shape: string;
  size?: number;
  color?: string;
}

export function CoverGlyph({ shape, size = 80, color = "#0E3B26" }: GlyphProps) {
  const s = size;
  const stroke = Math.max(2, s * 0.04);
  const common = {
    width: s,
    height: s,
    viewBox: "0 0 100 100" as const,
    fill: "none" as const,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (shape) {
    case "elephant":
      return (
        <svg {...common}>
          <path d="M22 62 Q22 42 42 38 Q60 34 72 44 Q82 52 80 66 Q78 76 68 76 L64 76 L64 82 L58 82 L58 76 L42 76 L42 82 L36 82 L36 76 Q28 74 22 66 Z" fill={color} fillOpacity="0.12" />
          <path d="M38 50 Q32 54 30 62 Q28 70 34 72" />
          <circle cx="54" cy="50" r="1.8" fill={color} stroke="none" />
          <path d="M40 54 Q52 58 64 54" strokeWidth={stroke * 1.2} />
        </svg>
      );
    case "diya":
      return (
        <svg {...common}>
          <path d="M20 62 Q50 74 80 62 Q76 70 60 72 L40 72 Q24 70 20 62 Z" fill={color} fillOpacity="0.18" />
          <path d="M50 62 Q48 50 50 40 Q52 50 50 62" />
          <path d="M46 42 Q50 30 54 42" fill={color} fillOpacity="0.3" />
          <circle cx="30" cy="38" r="1.6" fill={color} stroke="none" />
          <circle cx="70" cy="38" r="1.6" fill={color} stroke="none" />
          <circle cx="50" cy="22" r="1.6" fill={color} stroke="none" />
        </svg>
      );
    case "stride":
      return (
        <svg {...common}>
          <circle cx="50" cy="30" r="10" fill={color} fillOpacity="0.2" />
          <path d="M50 40 L50 62 M50 48 L38 56 M50 48 L62 52 M50 62 L40 78 M50 62 L60 78" />
        </svg>
      );
    case "hands":
      return (
        <svg {...common}>
          <path d="M35 70 Q35 56 42 50 L46 46 L46 38 Q46 34 50 34 Q54 34 54 38 L54 46 L58 50 Q65 56 65 70 Z" fill={color} fillOpacity="0.15" />
          <path d="M50 46 L50 36" />
          <path d="M42 78 L58 78" />
        </svg>
      );
    case "lotus":
      return (
        <svg {...common}>
          <path d="M50 30 Q58 40 50 58 Q42 40 50 30 Z" fill={color} fillOpacity="0.22" />
          <path d="M28 48 Q40 50 50 62 Q36 62 28 48 Z" fill={color} fillOpacity="0.22" />
          <path d="M72 48 Q60 50 50 62 Q64 62 72 48 Z" fill={color} fillOpacity="0.22" />
          <path d="M20 62 Q50 72 80 62" strokeWidth={stroke * 1.2} />
          <circle cx="50" cy="52" r="3" fill={color} stroke="none" />
        </svg>
      );
    case "numbers":
      return (
        <svg {...common}>
          <text x="50" y="68" textAnchor="middle" fontSize="56" fontWeight="800" fill={color} stroke="none" fontFamily="'Baloo 2',system-ui">1</text>
          <text x="28" y="40" textAnchor="middle" fontSize="16" fontWeight="700" fill={color} stroke="none" fontFamily="'Baloo 2',system-ui" opacity="0.5">२</text>
          <text x="72" y="40" textAnchor="middle" fontSize="16" fontWeight="700" fill={color} stroke="none" fontFamily="'Baloo 2',system-ui" opacity="0.5">3</text>
        </svg>
      );
    default:
      return null;
  }
}

interface BookCoverFallbackProps {
  product: Product;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

const SIZE_MAP = {
  xs:  { w: 64,  h: 80,  pad: 6,  glyph: 22, title: 7,  tag: 5 },
  sm:  { w: 110, h: 140, pad: 10, glyph: 38, title: 10, tag: 7 },
  md:  { w: 180, h: 228, pad: 14, glyph: 62, title: 14, tag: 8 },
  lg:  { w: 260, h: 330, pad: 20, glyph: 90, title: 18, tag: 10 },
  xl:  { w: 360, h: 460, pad: 28, glyph: 130, title: 26, tag: 12 },
};

export function BookCoverFallback({ product, className, size = "md" }: BookCoverFallbackProps) {
  const meta = getBookCoverMeta(product.slug);
  const { w, h, pad, glyph, title: ts, tag } = SIZE_MAP[size];

  return (
    <div
      className={className}
      style={{
        width: w,
        height: h,
        borderRadius: 4,
        position: "relative",
        background: meta.coverBg,
        color: meta.coverInk,
        overflow: "hidden",
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.04) inset, 0 0 0 1px rgba(0,0,0,0.05), 0 20px 40px -12px rgba(14,59,38,0.28), 0 8px 16px -8px rgba(14,59,38,0.18)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: pad,
        fontFamily: "'Baloo 2','Fredoka',system-ui,sans-serif",
      }}
    >
      {/* Spine shadow */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: Math.max(3, w * 0.025),
          background: "linear-gradient(90deg, rgba(0,0,0,0.18), rgba(0,0,0,0) 100%)",
          pointerEvents: "none",
        }}
      />
      {/* Publisher label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          fontFamily: "'Nunito',system-ui,sans-serif",
          fontSize: tag,
          fontWeight: 800,
          letterSpacing: 0.12,
          textTransform: "uppercase",
          opacity: 0.85,
        }}
      >
        <span>NitiVidya</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Miko Series</span>
      </div>
      {/* Glyph */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CoverGlyph shape={meta.shape} size={glyph} color={meta.coverInk} />
      </div>
      {/* Title */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div
          style={{
            fontFamily: "'Nunito',system-ui,sans-serif",
            fontSize: tag,
            fontWeight: 800,
            letterSpacing: 0.1,
            textTransform: "uppercase",
            opacity: 0.75,
          }}
        >
          {product.ageRange}
        </div>
        <div style={{ fontSize: ts, fontWeight: 800, lineHeight: 1.05, letterSpacing: -0.01 }}>
          {product.title}
        </div>
      </div>
      {/* Dot pattern overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.08,
          backgroundImage: `radial-gradient(circle at 8px 8px, ${meta.coverInk} 0.8px, transparent 1px)`,
          backgroundSize: `${Math.max(14, w * 0.07)}px ${Math.max(14, w * 0.07)}px`,
        }}
      />
    </div>
  );
}
