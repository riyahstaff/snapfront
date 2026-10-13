import React from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Field, H2, Segmented } from "@/components/ui";
import {
  DIGITAL_BLOCK_KINDS,
  DIGITAL_BODY_FONTS,
  DIGITAL_HEADING_FONTS,
  DIGITAL_PAGE_KINDS,
  newDigitalBlock,
  type DigitalBlock,
  type DigitalBlockKind,
  type DigitalDocument,
  type DigitalPage,
} from "@/lib/digital-design";
import type { DigitalPreviewSelection } from "./digital-preview-bridge";
import { radius, space, type, useColors } from "@/lib/theme";

type Props = {
  document: DigitalDocument;
  selection: DigitalPreviewSelection | null;
  undoCount: number;
  busy: boolean;
  onChange: (next: DigitalDocument) => void;
  onUndo: () => void;
  onAddPage: () => void;
  onDuplicatePage: (pageId: string) => void;
  onMovePage: (pageId: string, direction: -1 | 1) => void;
  onDeletePage: (page: DigitalPage) => void;
  onAddBlock: (pageId: string, kind: DigitalBlockKind) => void;
  onMoveBlock: (pageId: string, blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (pageId: string, block: DigitalBlock) => void;
  onUploadImage: (pageId: string, block: DigitalBlock) => void;
  /** Opens the separate studio only for an existing image block; it never creates a block implicitly. */
  onOpenDigitalPhotoStudio: (pageId: string, block: DigitalBlock) => void;
};

const coverFields = [
  ["title", "Title"], ["subtitle", "Subtitle"], ["brand", "Brand"], ["eyebrow", "Eyebrow"],
] as const;
const paletteFields = [
  ["paper", "Paper"], ["ink", "Ink"], ["accent", "Accent"], ["muted", "Muted"], ["soft", "Soft"],
] as const;

function blockLabel(kind: DigitalBlockKind) {
  return { heading: "Heading", paragraph: "Paragraph", list: "List", callout: "Callout", quote: "Quote", writing: "Writing area", image: "Image" }[kind];
}

function blockTextLabel(kind: DigitalBlockKind) {
  return kind === "quote" ? "Quote" : kind === "writing" ? "Writing prompt or instructions" : kind === "heading" ? "Heading" : kind === "callout" ? "Callout" : "Text";
}

/** Editing is source-document based: controls never alter the rendered SVG or product listing. */
export function DigitalDocumentControls(props: Props) {
  const c = useColors();
  const { document, selection, busy, onChange } = props;
  const recentImages = [...new Set(document.pages.flatMap((page) => page.blocks.map((block) => block.image_file).filter((file): file is string => Boolean(file))))];

  function replacePage(pageId: string, nextPage: DigitalPage) {
    onChange({ ...document, pages: document.pages.map((page) => page.id === pageId ? nextPage : page) });
  }

  function replaceBlock(pageId: string, blockId: string, nextBlock: DigitalBlock) {
    const page = document.pages.find((candidate) => candidate.id === pageId);
    if (!page) return;
    replacePage(pageId, { ...page, blocks: page.blocks.map((block) => block.id === blockId ? nextBlock : block) });
  }

  return (
    <View style={{ gap: space.xl }}>
      <View style={{ gap: space.md }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm }}>
          <H2>Cover and style</H2>
          <Button label={props.undoCount ? `Undo (${props.undoCount})` : "Undo"} variant="secondary" disabled={!props.undoCount || busy} onPress={props.onUndo} style={{ minHeight: 44, paddingHorizontal: space.md }} />
        </View>
        <Text style={[type.small, { color: c.muted }]}>Tap a field in the real preview or edit it here. Source text is never clipped.</Text>
        {coverFields.map(([field, label]) => {
          const selected = selection?.type === "field" && selection.field === field;
          return (
            <View key={field} style={[selected && { borderWidth: 2, borderRadius: radius.md, borderColor: c.flash, padding: 4 }]}>
              <Field label={selected ? `${label} · selected in preview` : label} value={document[field]} onChangeText={(value) => onChange({ ...document, [field]: value })} maxLength={field === "title" ? 300 : field === "subtitle" ? 500 : field === "brand" ? 200 : 120} multiline={field === "subtitle"} />
            </View>
          );
        })}
        {document.design_revision === 2 ? (
          <View style={{ gap: 5, padding: space.md, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.surface }}>
            <Text style={[type.label, { color: c.ink }]}>Cover artwork</Text>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: document.show_artwork !== false }} onPress={() => onChange({ ...document, show_artwork: document.show_artwork === false })} style={({ pressed }) => ({ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: space.md, borderWidth: 1, borderColor: c.line, borderRadius: radius.md, backgroundColor: c.bg, opacity: pressed ? 0.8 : 1 })}>
              <Text style={[type.body, { color: c.ink }]}>Show original artwork</Text>
              <Text style={[type.small, { color: document.show_artwork !== false ? c.accent : c.muted }]}>{document.show_artwork !== false ? "On" : "Off"}</Text>
            </Pressable>
            <Text style={[type.small, { color: c.muted }]}>Title and text always stay editable. An uploaded picture can replace the cover artwork.</Text>
          </View>
        ) : null}
        <Text style={[type.label, { color: c.ink }]}>Palette</Text>
        <Text style={[type.small, { color: c.muted }]}>Use six-digit hex colors, for example #7052E8.</Text>
        {paletteFields.map(([field, label]) => (
          <View key={field} style={{ flexDirection: "row", alignItems: "flex-end", gap: space.sm }}>
            <View style={{ width: 38, height: 38, borderRadius: radius.sm, borderWidth: 1, borderColor: c.line, backgroundColor: document.palette[field] }} accessibilityLabel={`${label} colour swatch`} />
            <View style={{ flex: 1 }}><Field label={label} value={document.palette[field]} onChangeText={(value) => onChange({ ...document, palette: { ...document.palette, [field]: value } })} maxLength={7} autoCapitalize="characters" /></View>
          </View>
        ))}
        <Text style={[type.label, { color: c.ink }]}>Heading font</Text>
        <Segmented value={document.fonts.heading} options={DIGITAL_HEADING_FONTS.map((value) => ({ value, label: value }))} onChange={(heading) => onChange({ ...document, fonts: { ...document.fonts, heading } })} />
        <Text style={[type.label, { color: c.ink }]}>Body font</Text>
        <Segmented value={document.fonts.body} options={DIGITAL_BODY_FONTS.map((value) => ({ value, label: value }))} onChange={(body) => onChange({ ...document, fonts: { ...document.fonts, body } })} />
      </View>

      <View style={{ gap: space.md }}>
        <H2>Source pages</H2>
        <Text style={[type.small, { color: c.muted }]}>Pages and blocks are the editable source. The renderer may paginate longer reading content in the final PDF.</Text>
        {document.pages.map((page, pageIndex) => (
          <PageEditor
            key={page.id}
            page={page}
            pageIndex={pageIndex}
            pageCount={document.pages.length}
            selection={selection}
            busy={busy}
            recentImages={recentImages}
            onReplacePage={(next) => replacePage(page.id, next)}
            onReplaceBlock={(blockId, next) => replaceBlock(page.id, blockId, next)}
            onDuplicate={() => props.onDuplicatePage(page.id)}
            onMovePage={(direction) => props.onMovePage(page.id, direction)}
            onDeletePage={() => props.onDeletePage(page)}
            onAddBlock={(kind) => props.onAddBlock(page.id, kind)}
            onMoveBlock={(blockId, direction) => props.onMoveBlock(page.id, blockId, direction)}
            onDeleteBlock={(block) => props.onDeleteBlock(page.id, block)}
            onUploadImage={(block) => props.onUploadImage(page.id, block)}
            onOpenDigitalPhotoStudio={(block) => props.onOpenDigitalPhotoStudio(page.id, block)}
          />
        ))}
        <Button label="Add source page" variant="secondary" disabled={busy || document.pages.length >= 60} onPress={props.onAddPage} />
      </View>
    </View>
  );
}

function PageEditor({
  page, pageIndex, pageCount, selection, busy, recentImages, onReplacePage, onReplaceBlock, onDuplicate, onMovePage, onDeletePage, onAddBlock, onMoveBlock, onDeleteBlock, onUploadImage, onOpenDigitalPhotoStudio,
}: {
  page: DigitalPage;
  pageIndex: number;
  pageCount: number;
  selection: DigitalPreviewSelection | null;
  busy: boolean;
  recentImages: string[];
  onReplacePage: (page: DigitalPage) => void;
  onReplaceBlock: (blockId: string, block: DigitalBlock) => void;
  onDuplicate: () => void;
  onMovePage: (direction: -1 | 1) => void;
  onDeletePage: () => void;
  onAddBlock: (kind: DigitalBlockKind) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onDeleteBlock: (block: DigitalBlock) => void;
  onUploadImage: (block: DigitalBlock) => void;
  onOpenDigitalPhotoStudio: (block: DigitalBlock) => void;
}) {
  const c = useColors();
  return (
    <View style={{ gap: space.md, padding: space.md, borderWidth: 1, borderColor: c.line, borderRadius: radius.lg, backgroundColor: c.surface }}>
      <Text style={[type.heading, { color: c.ink }]}>Page {pageIndex + 1}</Text>
      <Field label="Page title" value={page.title} maxLength={300} onChangeText={(title) => onReplacePage({ ...page, title })} />
      <Text style={[type.label, { color: c.ink }]}>Page type</Text>
      <Segmented value={page.kind} options={DIGITAL_PAGE_KINDS.map((value) => ({ value, label: value }))} onChange={(kind) => onReplacePage({ ...page, kind })} />
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
        <SmallAction label="Move earlier" disabled={busy || pageIndex === 0} onPress={() => onMovePage(-1)} />
        <SmallAction label="Move later" disabled={busy || pageIndex === pageCount - 1} onPress={() => onMovePage(1)} />
        <SmallAction label="Duplicate page" disabled={busy} onPress={onDuplicate} />
        <SmallAction label="Delete page" danger disabled={busy || pageCount <= 1} onPress={onDeletePage} />
      </View>
      <View style={{ gap: space.sm }}>
        <Text style={[type.label, { color: c.ink }]}>Blocks</Text>
        {page.blocks.map((block, blockIndex) => (
          <BlockEditor
            key={block.id}
            page={page}
            block={block}
            blockIndex={blockIndex}
            selected={selection?.type === "block" && selection.pageId === page.id && selection.blockId === block.id}
            busy={busy}
            recentImages={recentImages}
            onReplace={(next) => onReplaceBlock(block.id, next)}
            onMove={(direction) => onMoveBlock(block.id, direction)}
            onDelete={() => onDeleteBlock(block)}
            onUpload={() => onUploadImage(block)}
            onOpenDigitalPhotoStudio={() => onOpenDigitalPhotoStudio(block)}
          />
        ))}
      </View>
      <Text style={[type.label, { color: c.ink }]}>Add block</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {DIGITAL_BLOCK_KINDS.map((kind) => <SmallAction key={kind} label={`+ ${blockLabel(kind)}`} disabled={busy || page.blocks.length >= 40} onPress={() => onAddBlock(kind)} />)}
      </View>
    </View>
  );
}

function BlockEditor({ page, block, blockIndex, selected, busy, recentImages, onReplace, onMove, onDelete, onUpload, onOpenDigitalPhotoStudio }: {
  page: DigitalPage;
  block: DigitalBlock;
  blockIndex: number;
  selected: boolean;
  busy: boolean;
  recentImages: string[];
  onReplace: (block: DigitalBlock) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
  onUpload: () => void;
  onOpenDigitalPhotoStudio: () => void;
}) {
  const c = useColors();
  const isList = block.kind === "list";
  const isImage = block.kind === "image";
  return (
    <View style={{ gap: space.sm, borderWidth: selected ? 2 : 1, borderColor: selected ? c.flash : c.line, borderRadius: radius.md, padding: space.md, backgroundColor: c.bg }}>
      <Text style={[type.label, { color: c.ink }]}>{selected ? `Block ${blockIndex + 1} · selected in preview` : `Block ${blockIndex + 1}`}</Text>
      <Text style={[type.small, { color: c.muted }]}>Type</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }} accessibilityRole="radiogroup">
        {DIGITAL_BLOCK_KINDS.map((kind) => {
          const active = kind === block.kind;
          return <Pressable key={kind} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => {
            const created = newDigitalBlock(kind);
            onReplace({ ...created, id: block.id });
          }} style={{ minHeight: 40, justifyContent: "center", paddingHorizontal: 10, borderWidth: 1, borderRadius: radius.pill, borderColor: active ? c.accent : c.line, backgroundColor: active ? c.sunk : c.surface }}><Text style={[type.small, { color: c.ink }]}>{blockLabel(kind)}</Text></Pressable>;
        })}
      </View>
      {isList ? <ListEditor block={block} onReplace={onReplace} /> : null}
      {isImage ? <ImageEditor block={block} recentImages={recentImages} onReplace={onReplace} onUpload={onUpload} onOpenDigitalPhotoStudio={onOpenDigitalPhotoStudio} /> : null}
      {!isList && !isImage ? <Field label={blockTextLabel(block.kind)} value={block.text ?? ""} onChangeText={(text) => onReplace({ ...block, text })} maxLength={12000} multiline={block.kind !== "heading"} /> : null}
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
        <SmallAction label="Move up" disabled={busy || blockIndex === 0} onPress={() => onMove(-1)} />
        <SmallAction label="Move down" disabled={busy || blockIndex === page.blocks.length - 1} onPress={() => onMove(1)} />
        <SmallAction label="Remove block" danger disabled={busy} onPress={onDelete} />
      </View>
    </View>
  );
}

function ListEditor({ block, onReplace }: { block: DigitalBlock; onReplace: (block: DigitalBlock) => void }) {
  const items = block.items ?? [];
  return <View style={{ gap: space.sm }}>
    <Text style={[type.label, { color: useColors().ink }]}>List items</Text>
    {items.map((item, index) => <View key={`${block.id}_${index}`} style={{ gap: 4 }}><Field label={`Item ${index + 1}`} value={item} maxLength={1000} onChangeText={(value) => onReplace({ ...block, items: items.map((current, itemIndex) => itemIndex === index ? value : current) })} /><Button label="Remove item" variant="ghost" onPress={() => onReplace({ ...block, items: items.filter((_item, itemIndex) => itemIndex !== index) })} style={{ alignSelf: "flex-start", minHeight: 36, paddingHorizontal: 0 }} /></View>)}
    <Button label="Add list item" variant="secondary" disabled={items.length >= 100} onPress={() => onReplace({ ...block, items: [...items, "New item"] })} />
  </View>;
}

function ImageEditor({ block, recentImages, onReplace, onUpload, onOpenDigitalPhotoStudio }: { block: DigitalBlock; recentImages: string[]; onReplace: (block: DigitalBlock) => void; onUpload: () => void; onOpenDigitalPhotoStudio: () => void }) {
  const c = useColors();
  return <View style={{ gap: space.sm }}>
    <Text style={[type.small, { color: c.muted }]}>{block.image_file ? `Using owned image: ${block.image_file}` : "Choose an image stored in your seller account. URLs are not accepted."}</Text>
    <Button label="Upload an image" variant="secondary" onPress={onUpload} />
    <Button label="Make artwork in Digital Photo Studio" variant="secondary" onPress={onOpenDigitalPhotoStudio} />
    <Text style={[type.small, { color: c.muted }]}>The studio saves only a reviewed artwork candidate back to this existing image block. It never adds a new page or block.</Text>
    {recentImages.length ? <View style={{ gap: 4 }}><Text style={[type.small, { color: c.muted }]}>Reuse an image already in this design</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{recentImages.map((file) => <SmallAction key={file} label={file} onPress={() => onReplace({ ...block, image_file: file })} />)}</View></View> : null}
    {block.image_file ? <Button label="Remove image reference" variant="ghost" onPress={() => onReplace({ ...block, image_file: null })} style={{ alignSelf: "flex-start", minHeight: 36, paddingHorizontal: 0 }} /> : null}
    <Text style={[type.label, { color: c.ink }]}>Image fit</Text>
    <Segmented value={block.image_fit ?? "contain"} options={[{ value: "contain", label: "Contain" }, { value: "cover", label: "Cover" }]} onChange={(image_fit) => onReplace({ ...block, image_fit })} />
  </View>;
}

function SmallAction({ label, onPress, disabled, danger }: { label: string; onPress: () => void; disabled?: boolean; danger?: boolean }) {
  const c = useColors();
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} disabled={disabled} onPress={onPress} style={({ pressed }) => ({ minHeight: 42, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderRadius: radius.pill, borderColor: c.line, backgroundColor: c.surface, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 })}><Text style={[type.small, { color: danger ? c.bad : c.ink }]}>{label}</Text></Pressable>;
}
