import type { DigitalDesignRecord, DigitalExport } from "./api";
import { cloneDigitalDocument, digitalDesignRevision, type DigitalDocument, type DigitalTemplateSummary } from "./digital-design";

export const DIGITAL_UNDO_LIMIT = 25;

/** Keeps original writing/pages intact when a seller chooses a different visual template. */
export function applyDigitalTemplateStyle(document: DigitalDocument, template: Pick<DigitalTemplateSummary, "id" | "format" | "palette" | "fonts" | "design_revision">): DigitalDocument {
  const source = cloneDigitalDocument(document);
  delete source.show_artwork;
  const revision = digitalDesignRevision(template, 2);
  return {
    ...source,
    format: template.format,
    template_id: template.id,
    design_revision: revision,
    ...(revision === 2 ? { show_artwork: true } : {}),
    palette: { ...template.palette },
    fonts: { ...template.fonts },
  };
}

/** Snapshots are session-only and deliberately bounded; the editor never caches source locally. */
export function appendDigitalUndo(history: readonly DigitalDocument[], document: DigitalDocument): DigitalDocument[] {
  return [...history, cloneDigitalDocument(document)].slice(-DIGITAL_UNDO_LIMIT);
}

export function isCurrentDigitalExport(input: {
  export: DigitalExport | null;
  revision: number;
  savedGeneration: number | null;
  draftGeneration: number;
  previewHash: string | null;
}): input is typeof input & { export: DigitalExport } {
  return Boolean(
    input.export
      && input.export.revision === input.revision
      && input.savedGeneration === input.draftGeneration
      && input.previewHash === input.export.document_hash,
  );
}

/** 409 is deliberately not retried: overwriting another saved revision is never safe. */
export function digitalSaveError(error: { status?: number; message?: string } | null | undefined): string {
  if (error?.status === 409) return "This design changed on the server. Your edits are still on this device, but were not saved. Reload the server copy or review and save your version after resolving the difference.";
  if (error?.status === 404 || error?.status === 501) return "Digital Design Studio is not active on this backend yet. Nothing was saved or attached.";
  if (error?.status === 0) return "You are offline or Snapfront could not be reached. Your edits are still on this screen; reconnect and try again.";
  return error?.message || "That digital design request could not finish. Nothing was changed on the product.";
}

export function recordForCurrentRevision(record: DigitalDesignRecord, revision: number): boolean {
  return record.revision === revision && Boolean(record.document);
}
