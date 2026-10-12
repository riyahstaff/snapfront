// Premium storefront catalog. Themes inherit a shared structural family so a seller gets
// a distinctive composition as well as a palette. The renderer/CSS use `family`, rather
// than a separate template for every individual theme.

const colors = ({ bg, surface, ink, muted, line, accent, onAccent, badge, onBadge, panel, onPanel, foot, onFoot, bar, onBar }) => ({
  bg, surface, ink, muted, line, accent, onAccent, badge, onBadge,
  panel: panel || surface, onPanel: onPanel || ink, foot: foot || ink, onFoot: onFoot || bg,
  bar: bar || ink, onBar: onBar || bg,
});

const FAMILIES = {
  maison: {
    header: "center", hero: "split", cats: "tile", card: "minimal", ratio: "3/4", rCard: 2, rBtn: 0,
    upper: "buttons", heroScale: 1.08,
  },
  luminous: {
    header: "split", hero: "split", cats: "circle", card: "clean", ratio: "4/5", rCard: 24, rBtn: 999,
  },
  cinema: {
    header: "split", hero: "spotlight", cats: "pill", card: "glass", ratio: "1/1", rCard: 12, rBtn: 6,
  },
  gallery: {
    header: "split", hero: "type", cats: "tile", card: "clean", ratio: "1/1", rCard: 0, rBtn: 2,
    upper: "titles", heroScale: 1.04,
  },
  journal: {
    header: "center", hero: "editorial", cats: "tile", card: "minimal", ratio: "3/4", rCard: 0, rBtn: 0,
  },
};

const premium = (family, spec) => ({
  ...FAMILIES[family],
  ...spec,
  collection: "premium",
  family,
  category: spec.category,
  copy: spec.copy,
  c: colors(spec.c),
});

const type = (display, displaySpec, weight, tracking, body, bodySpec) => ({
  display: [display, displaySpec, weight, tracking], body: [body, bodySpec],
});

export const PREMIUM_THEMES = [
  // Maison — luxury editorial split, tailored panels and framed photography.
  premium("maison", { id: "p-maison-aurel", name: "Maison Aurel", for: "Fine jewelry and occasionwear", category: "Fashion & accessories", vibe: "Warm ivory, oxblood, and a composed boutique edit", motion: "pan",
    fonts: type("Cormorant Garamond", "ital,wght@0,500;0,600;1,500", 600, "-.015em", "Manrope", "wght@400;500;600"),
    c: { bg: "#FAF6EF", surface: "#FFFDFC", ink: "#251A19", muted: "#74635D", line: "#E7DCD0", accent: "#7D2634", onAccent: "#FFFFFF", badge: "#D8B88A", onBadge: "#251A19", panel: "#EDE0D2", onPanel: "#251A19", foot: "#251A19", onFoot: "#F7EDE2", bar: "#7D2634", onBar: "#FFFFFF" },
    copy: { eyebrow: "The considered edit", collection: "Pieces for every occasion", cta: "Explore pieces" } }),
  premium("maison", { id: "p-maison-rouge", name: "Rouge Atelier", for: "Leather goods and fragrance", category: "Fashion & accessories", vibe: "Plum, parchment, and ceremonial restraint", motion: "still",
    fonts: type("Bodoni Moda", "opsz,wght@6..96,500;6..96,600", 600, "-.01em", "DM Sans", "opsz,wght@9..40,400;9..40,500;9..40,700"),
    c: { bg: "#F6F0EB", surface: "#FFFDF9", ink: "#321620", muted: "#745E63", line: "#E2D4D2", accent: "#8A2943", onAccent: "#FFFFFF", badge: "#E7C5B2", onBadge: "#321620", panel: "#E9D7D3", onPanel: "#321620", foot: "#291019", onFoot: "#F5E7E4", bar: "#321620", onBar: "#F5E7E4" },
    copy: { eyebrow: "A quiet occasion", collection: "Leather and fragrance, considered", cta: "View the edit" } }),
  premium("maison", { id: "p-maison-serein", name: "Serein", for: "Ceramics and elevated home", category: "Home & living", vibe: "Chalk, ink, and a calm collector’s shelf", motion: "drift",
    fonts: type("DM Serif Display", "ital@0;1", 400, "-.01em", "Karla", "wght@400;500;700"),
    c: { bg: "#F4F1EA", surface: "#FCFAF5", ink: "#263139", muted: "#657078", line: "#DCE0DA", accent: "#3C5962", onAccent: "#FFFFFF", badge: "#D6C8A6", onBadge: "#263139", panel: "#DDE6E3", onPanel: "#263139", foot: "#263139", onFoot: "#EDF0EA", bar: "#3C5962", onBar: "#FFFFFF" },
    copy: { eyebrow: "Made for the everyday", collection: "Objects for everyday living", cta: "See the collection" } }),
  premium("maison", { id: "p-maison-nocturne", name: "Nocturne House", for: "Candles and evening pieces", category: "Home & living", vibe: "Inky blue, pearl, and intimate editorial light", motion: "pan",
    fonts: type("Playfair Display", "ital,wght@0,500;0,600;1,500", 600, "-.01em", "Inter", "opsz,wght@14..32,400;14..32,500;14..32,600"),
    c: { bg: "#F5F3F0", surface: "#FCFBF8", ink: "#172131", muted: "#657083", line: "#DCE0E5", accent: "#263D63", onAccent: "#FFFFFF", badge: "#DABF91", onBadge: "#172131", panel: "#DCE3EC", onPanel: "#172131", foot: "#172131", onFoot: "#E6EAF0", bar: "#263D63", onBar: "#FFFFFF" },
    copy: { eyebrow: "After daylight", collection: "Evening pieces and candlelight", cta: "Discover now" } }),
  premium("maison", { id: "p-maison-terrace", name: "Terrace", for: "Tableware and slow living", category: "Home & living", vibe: "Sun-baked clay and a refined market table", motion: "still",
    fonts: type("Fraunces", "opsz,wght@9..144,500;9..144,600", 600, "-.02em", "Source Sans 3", "wght@400;600;700"),
    c: { bg: "#FBF5EC", surface: "#FFFDF8", ink: "#422B20", muted: "#806657", line: "#EBDCCD", accent: "#A84F35", onAccent: "#FFFFFF", badge: "#E9BF6C", onBadge: "#422B20", panel: "#F1D9C6", onPanel: "#422B20", foot: "#422B20", onFoot: "#F9EBDD", bar: "#A84F35", onBar: "#FFFFFF" },
    copy: { eyebrow: "Set the table slowly", collection: "For the table", cta: "Shop the table" } }),

  // Luminous — airy floating product split, soft surfaces and rounded media.
  premium("luminous", { id: "p-luminous-lune", name: "Lune", for: "Beauty and skincare", category: "Beauty & wellness", vibe: "Warm pearl ivory, moss green, and a silvered botanical glow", motion: "pan",
    fonts: type("Instrument Serif", "ital@0;1", 400, "-.025em", "DM Sans", "opsz,wght@9..40,400;9..40,500;9..40,700"),
    c: { bg: "#F9F5EB", surface: "#FFFDF8", ink: "#26352B", muted: "#6F786D", line: "#E4E2D6", accent: "#47644D", onAccent: "#FFFFFF", badge: "#D8DDD4", onBadge: "#26352B", panel: "#E9EADD", onPanel: "#26352B", foot: "#26352B", onFoot: "#F6F2E9", bar: "#D8DDD4", onBar: "#26352B" },
    copy: { eyebrow: "A softer ritual", collection: "A gentler daily ritual", cta: "Find your ritual" } }),
  premium("luminous", { id: "p-luminous-pearl", name: "Pearl Form", for: "Wellness and bath", category: "Beauty & wellness", vibe: "Clean white, mineral blue, and quietly buoyant forms", motion: "still",
    fonts: type("Newsreader", "opsz,wght@6..72,500;6..72,600", 600, "-.015em", "Plus Jakarta Sans", "wght@400;500;600"),
    c: { bg: "#F8FCFD", surface: "#FFFFFF", ink: "#1F3941", muted: "#6C8187", line: "#DCECEF", accent: "#4C909E", onAccent: "#FFFFFF", badge: "#D7EEF0", onBadge: "#1F3941", panel: "#E3F0F1", onPanel: "#1F3941", foot: "#1F3941", onFoot: "#E5F0F1", bar: "#D7EEF0", onBar: "#1F3941" },
    copy: { eyebrow: "A daily pause", collection: "Care for everyday rituals", cta: "Browse essentials" } }),
  premium("luminous", { id: "p-luminous-verde", name: "Verde Light", for: "Botanicals and self care", category: "Beauty & wellness", vibe: "Sage and cream with botanical air", motion: "drift",
    fonts: type("Cormorant Infant", "ital,wght@0,500;0,600;1,500", 600, "-.01em", "Outfit", "wght@400;500;600"),
    c: { bg: "#F7FAF4", surface: "#FFFFFF", ink: "#2C3A2A", muted: "#72806C", line: "#E1E9DC", accent: "#66845A", onAccent: "#FFFFFF", badge: "#DCE8D1", onBadge: "#2C3A2A", panel: "#E6EEDC", onPanel: "#2C3A2A", foot: "#2C3A2A", onFoot: "#E9F0E5", bar: "#66845A", onBar: "#FFFFFF" },
    copy: { eyebrow: "Room to breathe", collection: "Botanical care, simply", cta: "Shop botanicals" } }),
  premium("luminous", { id: "p-luminous-iris", name: "Iris", for: "Stationery and gifts", category: "Art & stationery", vibe: "Iris blue and cream for bright thoughtful gifts", motion: "pan",
    fonts: type("Lora", "wght@400;500;600", 600, "-.01em", "Figtree", "wght@400;500;600;700"),
    c: { bg: "#FAFBFF", surface: "#FFFFFF", ink: "#28334E", muted: "#6D7895", line: "#E1E6F2", accent: "#5D77B8", onAccent: "#FFFFFF", badge: "#DEE7FF", onBadge: "#28334E", panel: "#E7EDFA", onPanel: "#28334E", foot: "#28334E", onFoot: "#E7ECF7", bar: "#5D77B8", onBar: "#FFFFFF" },
    copy: { eyebrow: "A note worth keeping", collection: "Notes and thoughtful gifts", cta: "Explore gifts" } }),
  premium("luminous", { id: "p-luminous-soleil", name: "Soleil", for: "Accessories and joyful home", category: "Gifts & lifestyle", vibe: "Butter yellow, pale peach, and generous light", motion: "still",
    fonts: type("DM Serif Display", "ital@0;1", 400, "-.01em", "Nunito Sans", "opsz,wght@6..12,400;6..12,600;6..12,700"),
    c: { bg: "#FFFDF7", surface: "#FFFFFF", ink: "#493C26", muted: "#88795F", line: "#F0E7D4", accent: "#BF8D37", onAccent: "#FFFFFF", badge: "#FCE5AB", onBadge: "#493C26", panel: "#F9EFD1", onPanel: "#493C26", foot: "#493C26", onFoot: "#FAF1DA", bar: "#FCE5AB", onBar: "#493C26" },
    copy: { eyebrow: "A little more light", collection: "Bright details for everyday", cta: "Shop the selection" } }),

  // Cinema — dark spotlight for premium audio, fragrance, and tactile product stories.
  premium("cinema", { id: "p-cinema-forma", name: "Forma", for: "Cinematic audio and sound systems", category: "Tech & audio", vibe: "Dark graphite, copper-orange light, and a cinematic sound stage", motion: "pan", dark: true,
    fonts: type("Sora", "wght@600;700", 700, "-.04em", "Manrope", "wght@400;500;700"),
    c: { bg: "#121313", surface: "#1B1C1C", ink: "#F6F0E9", muted: "#B8AEA5", line: "#393635", accent: "#C76A35", onAccent: "#1A0F0A", badge: "#E0A071", onBadge: "#1A0F0A", panel: "#1B1C1C", onPanel: "#F6F0E9", foot: "#090A0A", onFoot: "#D9D0C7", bar: "#C76A35", onBar: "#1A0F0A" },
    copy: { eyebrow: "Sound, in focus", collection: "A cinematic listening room", cta: "Explore audio" } }),
  premium("cinema", { id: "p-cinema-ember", name: "Ember", for: "Fragrance and candles", category: "Beauty & wellness", vibe: "Charcoal, ember red, and after-dark atmosphere", motion: "drift", dark: true,
    fonts: type("Playfair Display", "ital,wght@0,500;0,600;1,500", 600, "-.01em", "Raleway", "wght@400;500;600"),
    c: { bg: "#171211", surface: "#231A18", ink: "#F5EDEA", muted: "#B6A29A", line: "#3A2B28", accent: "#C76442", onAccent: "#211310", badge: "#E4A36D", onBadge: "#211310", panel: "#231A18", onPanel: "#F5EDEA", foot: "#0D0908", onFoot: "#D4C2BB", bar: "#C76442", onBar: "#211310" },
    copy: { eyebrow: "Light, held close", collection: "After-dark atmosphere", cta: "Enter the collection" } }),
  premium("cinema", { id: "p-cinema-copper", name: "Copperline", for: "Barware and design objects", category: "Home & living", vibe: "Copper light across a near-black object gallery", motion: "still", dark: true,
    fonts: type("Marcellus", "wght@400", 400, ".02em", "IBM Plex Sans", "wght@400;500;600"),
    c: { bg: "#161414", surface: "#211C1A", ink: "#F4EEE8", muted: "#B4A49A", line: "#3D312D", accent: "#C98059", onAccent: "#22130D", badge: "#E2B096", onBadge: "#22130D", panel: "#211C1A", onPanel: "#F4EEE8", foot: "#0E0C0B", onFoot: "#D9CBC1", bar: "#C98059", onBar: "#22130D" },
    copy: { eyebrow: "Objects, in focus", collection: "Objects for the bar", cta: "View objects" } }),
  premium("cinema", { id: "p-cinema-midnight", name: "Midnight Standard", for: "Audio and performance gear", category: "Tech & audio", vibe: "Midnight blue with electric, restrained contrast", motion: "pan", dark: true,
    fonts: type("Space Grotesk", "wght@500;700", 700, "-.045em", "Inter", "opsz,wght@14..32,400;14..32,500;14..32,600"),
    c: { bg: "#0D1322", surface: "#151D31", ink: "#EDF3FF", muted: "#9BA9C4", line: "#29354F", accent: "#7C9EEB", onAccent: "#0E1730", badge: "#B7C9FF", onBadge: "#0E1730", panel: "#151D31", onPanel: "#EDF3FF", foot: "#070B14", onFoot: "#C4D0E6", bar: "#7C9EEB", onBar: "#0E1730" },
    copy: { eyebrow: "Tune out the noise", collection: "Sound and performance, refined", cta: "Explore the line" } }),
  premium("cinema", { id: "p-cinema-velour", name: "Velour", for: "Nightwear and accessories", category: "Fashion & accessories", vibe: "Velvet aubergine and soft metallic light", motion: "drift", dark: true,
    fonts: type("Bodoni Moda", "opsz,wght@6..96,500;6..96,600", 600, "-.01em", "Lato", "wght@400;700"),
    c: { bg: "#1B1220", surface: "#281932", ink: "#F8EFF8", muted: "#C3AFC9", line: "#43294E", accent: "#D3A3C8", onAccent: "#25132A", badge: "#E5C2DB", onBadge: "#25132A", panel: "#281932", onPanel: "#F8EFF8", foot: "#100A13", onFoot: "#DDCAE0", bar: "#D3A3C8", onBar: "#25132A" },
    copy: { eyebrow: "The evening edit", collection: "Evening pieces, softly lit", cta: "Shop after dark" } }),

  // Gallery — asymmetric design-object composition, oversized typography, unboxed grids.
  premium("gallery", { id: "p-gallery-forme", name: "Forme Studio", for: "Furniture and design objects", category: "Home & living", vibe: "Gallery white, cobalt, and exacting geometry", motion: "still",
    fonts: type("Space Grotesk", "wght@500;700", 700, "-.055em", "IBM Plex Sans", "wght@400;500;600"),
    c: { bg: "#F7F7F4", surface: "#FFFFFF", ink: "#131517", muted: "#696D70", line: "#DFE0DB", accent: "#315DE8", onAccent: "#FFFFFF", badge: "#C7D5FF", onBadge: "#131517", panel: "#E7ECFB", onPanel: "#131517", foot: "#131517", onFoot: "#E9EBE7", bar: "#315DE8", onBar: "#FFFFFF" },
    copy: { eyebrow: "Form follows feeling", collection: "Objects with presence", cta: "View the objects" } }),
  premium("gallery", { id: "p-gallery-objet", name: "Objet", for: "Sculpture and home accents", category: "Home & living", vibe: "Stone, ink, and an unhurried object study", motion: "pan",
    fonts: type("Archivo", "wght@600;700", 700, "-.035em", "Karla", "wght@400;500;700"),
    c: { bg: "#F2F0EB", surface: "#FBFAF7", ink: "#292725", muted: "#716D67", line: "#DBD7CE", accent: "#4D4B46", onAccent: "#FFFFFF", badge: "#D8D0BF", onBadge: "#292725", panel: "#E6E0D5", onPanel: "#292725", foot: "#292725", onFoot: "#E7E3DA", bar: "#4D4B46", onBar: "#FFFFFF" },
    copy: { eyebrow: "An object study", collection: "Sculptural accents for home", cta: "Browse objects" } }),
  premium("gallery", { id: "p-gallery-grid", name: "Gridline", for: "Prints and contemporary goods", category: "Art & stationery", vibe: "Paper white, vermilion, and graphic rhythm", motion: "still",
    fonts: type("Syne", "wght@700;800", 800, "-.04em", "DM Sans", "opsz,wght@9..40,400;9..40,500;9..40,700"),
    c: { bg: "#FFFDF8", surface: "#FFFFFF", ink: "#151515", muted: "#67625D", line: "#E7E1D7", accent: "#DC3C2B", onAccent: "#FFFFFF", badge: "#FFE180", onBadge: "#151515", panel: "#F6E5D9", onPanel: "#151515", foot: "#151515", onFoot: "#F6F0E7", bar: "#DC3C2B", onBar: "#FFFFFF" },
    copy: { eyebrow: "A useful line", collection: "Graphic goods and new prints", cta: "See what is new" } }),
  premium("gallery", { id: "p-gallery-arch", name: "Arch", for: "Interiors and textiles", category: "Home & living", vibe: "Plaster, olive, and architectural calm", motion: "drift",
    fonts: type("Marcellus", "wght@400", 400, ".02em", "Work Sans", "wght@400;500;600"),
    c: { bg: "#F5F2E9", surface: "#FCFBF7", ink: "#31352A", muted: "#747867", line: "#DCDCCE", accent: "#687244", onAccent: "#FFFFFF", badge: "#DBD7B1", onBadge: "#31352A", panel: "#E4E4D0", onPanel: "#31352A", foot: "#31352A", onFoot: "#E7E7D8", bar: "#687244", onBar: "#FFFFFF" },
    copy: { eyebrow: "Space, considered", collection: "Quiet interiors, considered", cta: "Explore the edit" } }),
  premium("gallery", { id: "p-gallery-mono", name: "Mono Studio", for: "Minimal apparel and accessories", category: "Fashion & accessories", vibe: "Monochrome contrast and a precise studio grid", motion: "pan",
    fonts: type("Archivo", "wght@600;700", 700, "-.04em", "Inter Tight", "wght@400;500;600"),
    c: { bg: "#F5F5F3", surface: "#FFFFFF", ink: "#101010", muted: "#666666", line: "#DEDEDC", accent: "#101010", onAccent: "#FFFFFF", badge: "#DADADA", onBadge: "#101010", panel: "#E8E8E5", onPanel: "#101010", foot: "#101010", onFoot: "#EAEAE7", bar: "#101010", onBar: "#FFFFFF" },
    copy: { eyebrow: "Less, precisely", collection: "The everyday uniform", cta: "Shop the uniform" } }),

  // Journal — image-first campaign editorial with a magazine-like lead image.
  premium("journal", { id: "p-journal-issue", name: "Issue One", for: "Fashion and limited releases", category: "Fashion & accessories", vibe: "A monochrome campaign page with a sharp red note", motion: "pan",
    fonts: type("Instrument Serif", "ital@0;1", 400, "-.03em", "Inter Tight", "wght@400;500;600"),
    c: { bg: "#FCFCFA", surface: "#F4F4F1", ink: "#111111", muted: "#616161", line: "#E0E0DD", accent: "#C92D34", onAccent: "#FFFFFF", badge: "#111111", onBadge: "#FFFFFF", panel: "#EEEEEA", onPanel: "#111111", foot: "#111111", onFoot: "#EEEEEA", bar: "#111111", onBar: "#FFFFFF" },
    copy: { eyebrow: "Volume 01", collection: "The current release", cta: "Read the collection" } }),
  premium("journal", { id: "p-journal-field", name: "Field Notes", for: "Outdoor and natural goods", category: "Outdoor & recreation", vibe: "Field paper, fern green, and an image-led dispatch", motion: "drift",
    fonts: type("Young Serif", "wght@400", 400, "-.015em", "Work Sans", "wght@400;500;600"),
    c: { bg: "#F5F3EA", surface: "#FCFBF5", ink: "#243329", muted: "#657064", line: "#D9DDD0", accent: "#476746", onAccent: "#FFFFFF", badge: "#D7E1C5", onBadge: "#243329", panel: "#E5E9D7", onPanel: "#243329", foot: "#243329", onFoot: "#E6EADB", bar: "#476746", onBar: "#FFFFFF" },
    copy: { eyebrow: "Field notes", collection: "For days spent outside", cta: "Explore the field guide" } }),
  premium("journal", { id: "p-journal-canvas", name: "Canvas", for: "Art prints and studio goods", category: "Art & stationery", vibe: "Canvas white, ultramarine, and a gallery feature story", motion: "still",
    fonts: type("Libre Baskerville", "wght@400;700", 700, "-.01em", "Montserrat", "wght@400;500;600"),
    c: { bg: "#F9F8F3", surface: "#FFFFFF", ink: "#1C2942", muted: "#66718A", line: "#E0E3EA", accent: "#315CAD", onAccent: "#FFFFFF", badge: "#D8E2FC", onBadge: "#1C2942", panel: "#E7EDF9", onPanel: "#1C2942", foot: "#1C2942", onFoot: "#E6EBF4", bar: "#315CAD", onBar: "#FFFFFF" },
    copy: { eyebrow: "Studio dispatch", collection: "Prints and studio goods", cta: "View the studio" } }),
  premium("journal", { id: "p-journal-ritual", name: "Ritual Paper", for: "Tea, apothecary and home", category: "Beauty & wellness", vibe: "Tea paper, soft rose, and slow daily rituals", motion: "drift",
    fonts: type("Cormorant Garamond", "ital,wght@0,500;0,600;1,500", 600, "-.01em", "Jost", "wght@400;500"),
    c: { bg: "#FBF6F1", surface: "#FFFDFC", ink: "#493734", muted: "#856B66", line: "#EDDDD6", accent: "#9C605D", onAccent: "#FFFFFF", badge: "#F0D3CC", onBadge: "#493734", panel: "#F3E1DA", onPanel: "#493734", foot: "#493734", onFoot: "#F6E8E1", bar: "#9C605D", onBar: "#FFFFFF" },
    copy: { eyebrow: "A daily ritual", collection: "For slower moments", cta: "Find your ritual" } }),
  premium("journal", { id: "p-journal-sunday", name: "Sunday Edition", for: "Flowers, gifts and small joys", category: "Gifts & lifestyle", vibe: "Sunday paper, butter yellow, and an optimistic feature", motion: "pan",
    fonts: type("Fraunces", "opsz,wght@9..144,500;9..144,600", 600, "-.02em", "Nunito Sans", "opsz,wght@6..12,400;6..12,600;6..12,700"),
    c: { bg: "#FFFCEF", surface: "#FFFFFF", ink: "#3D3827", muted: "#7E765B", line: "#F0E7C8", accent: "#B77D2D", onAccent: "#FFFFFF", badge: "#F8DF83", onBadge: "#3D3827", panel: "#FAEDBD", onPanel: "#3D3827", foot: "#3D3827", onFoot: "#F8EFCB", bar: "#F8DF83", onBar: "#3D3827" },
    copy: { eyebrow: "Sunday, unhurried", collection: "Small joys for the week", cta: "See the Sunday edit" } }),
];
