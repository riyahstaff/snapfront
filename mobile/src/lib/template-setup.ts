import type { StorePatch, StoreTheme } from "./api";
import {
  TEMPLATE_EDITABLE_FIELDS,
  newStorefrontDraft,
  type StorefrontDraft,
  type TemplateEditableField,
  type TemplatePhoto,
  type TemplatePhotoSlot,
} from "./storefront-draft";

export type { TemplateEditableField, TemplatePhoto, TemplatePhotoSlot } from "./storefront-draft";

export type TemplatePhotoPatch = Pick<StorePatch, "design_photos"> & Pick<StorePatch, "banner_file">;
export type TemplateContentPatch = Omit<StorePatch, "banner_file" | "design_photos">;

const hasOwn = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const sampleSet = (draft: StorefrontDraft) => new Set<TemplateEditableField>(draft.sample_fields);
const copy = (theme: StoreTheme, key: keyof NonNullable<StoreTheme["copy"]>) =>
  typeof theme.copy?.[key] === "string" ? theme.copy[key]!.trim() : "";

/**
 * These strings are visual placeholders, never claims about a seller. They are marked in
 * `sample_fields` until a seller edits them through `editTemplateDraft`.
 */
export function templateSampleCopy(theme: StoreTheme): Pick<StorefrontDraft, "hero_title" | "hero_subtitle" | "hero_eyebrow" | "hero_cta" | "tagline" | "about"> {
  const title = copy(theme, "title") || "Your collection title";
  const subtitle = copy(theme, "subtitle") || "Add a short introduction to your collection.";
  return {
    hero_title: title,
    hero_subtitle: subtitle,
    hero_eyebrow: copy(theme, "eyebrow") || copy(theme, "collection") || "Your collection",
    hero_cta: copy(theme, "cta") || "Explore the collection",
    tagline: subtitle,
    about: `This is example layout copy for ${theme.name}. Replace it with your own store story.`,
  };
}

/**
 * Apply a new theme's labelled example copy only to an empty field or one still marked as a
 * sample. Seller-edited wording, store name, notes, progress, and all photos survive a theme switch.
 */
export function seedThemeDraft(draft: StorefrontDraft, theme: StoreTheme): StorefrontDraft {
  const current = newStorefrontDraft(draft);
  const samples = templateSampleCopy(theme);
  const tracked = sampleSet(current);
  const values: Partial<StorefrontDraft> = { theme: theme.id, template_theme: theme.id };
  // Classic templates render tagline/about only. Do not silently seed hidden premium-only fields.
  const fields = theme.collection === "classic" || (!theme.collection && !theme.id.startsWith("p-"))
    ? ["tagline", "about"] as const
    : Object.keys(samples) as (keyof typeof samples)[];
  for (const field of fields) {
    if (!current[field].trim() || tracked.has(field)) {
      values[field] = samples[field];
      tracked.add(field);
    }
  }
  return newStorefrontDraft({ ...current, ...values, sample_fields: [...tracked] });
}

/**
 * Use this for an explicit text-input/save action. Only fields actually present in `values` lose
 * their sample marker; untouched samples remain visibly/example-only sample copy.
 */
export function editTemplateDraft(draft: StorefrontDraft, values: Partial<StorefrontDraft>): StorefrontDraft {
  const tracked = sampleSet(draft);
  for (const field of TEMPLATE_EDITABLE_FIELDS) if (hasOwn(values, field)) tracked.delete(field);
  return newStorefrontDraft({ ...draft, ...values, sample_fields: [...tracked] });
}

/** Clear only sample fields the seller explicitly chose to remove during copy review. */
export function clearSampleCopy(draft: StorefrontDraft, fields: readonly TemplateEditableField[]): StorefrontDraft {
  const tracked = sampleSet(draft);
  const values: Partial<StorefrontDraft> = {};
  for (const field of fields) {
    if (!(TEMPLATE_EDITABLE_FIELDS as readonly string[]).includes(field)) continue;
    values[field] = "";
    tracked.delete(field);
  }
  return newStorefrontDraft({ ...draft, ...values, sample_fields: [...tracked] });
}

/** Return the currently selected server-owned photo reference for one of the three fixed slots. */
export function templatePhotoForSlot(draft: StorefrontDraft, slot: TemplatePhotoSlot): TemplatePhoto | null {
  const file = slot === 0 ? draft.banner_file : draft.photo_files?.[slot - 1] ?? null;
  const url = slot === 0 ? draft.banner_url : draft.photo_urls?.[slot - 1] ?? null;
  return file && url ? { image_file: file, image_url: url } : null;
}

/**
 * Build the photo-only part of a template preview/apply patch. Auxiliary order is fixed: slot 1,
 * slot 2. The main banner is omitted when empty so an existing applied public cover is not removed
 * by an unconfigured local draft; auxiliary nulls deliberately represent cleared detail slots.
 */
export function templatePhotoPatch(draft: StorefrontDraft): TemplatePhotoPatch {
  const normalized = newStorefrontDraft(draft);
  return {
    ...(normalized.banner_file ? { banner_file: normalized.banner_file } : {}),
    design_photos: [normalized.photo_files?.[0] ?? null, normalized.photo_files?.[1] ?? null],
  };
}

/**
 * Build text/style fields without any image references. Example fields are excluded by default so
 * a theme demo cannot silently become a seller claim in the final patch. Set `includeSamples` only
 * for an explicitly labelled template-mode preview.
 */
export function remainingTemplateContent(draft: StorefrontDraft, includeSamples = false): TemplateContentPatch {
  const normalized = newStorefrontDraft(draft);
  const samples = sampleSet(normalized);
  const editable = (field: TemplateEditableField) => includeSamples || !samples.has(field) ? normalized[field].trim() : "";
  return {
    store_name: normalized.store_name.trim(),
    theme: normalized.theme,
    hero_motion: normalized.hero_motion,
    hero_title: editable("hero_title"),
    hero_subtitle: editable("hero_subtitle"),
    hero_eyebrow: editable("hero_eyebrow"),
    hero_cta: editable("hero_cta"),
    tagline: editable("tagline"),
    about: editable("about"),
    announcement: editable("announcement"),
  };
}

/** Convenience for parent preview requests; it contains no notes, base64, products, plan, or checkout data. */
export function templatePreviewPatch(draft: StorefrontDraft, includeSamples = false): StorePatch {
  return { ...remainingTemplateContent(draft, includeSamples), ...templatePhotoPatch(draft) };
}
