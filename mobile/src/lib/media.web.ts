// Web version of media.ts: "Save" downloads the files to the computer, and "Share" uses the
// browser's share sheet where there is one (phones, Safari, Edge), otherwise it downloads too.
// Web-only file: the phone app never loads it.

async function fetchBlob(url: string): Promise<{ blob: Blob; name: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const name = url.split("/").pop()?.split("?")[0] || `snapfront-${Date.now()}`;
  return { blob: await res.blob(), name };
}

function downloadBlob(blob: Blob, name: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href; a.download = name; a.rel = "noopener";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}

/** Download photos or videos to the computer. */
export async function saveToPhone(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    const { blob, name } = await fetchBlob(url);
    downloadBlob(blob, name);
  }
  return true;
}

/** Share one file (Instagram, Messages...) where the browser can; otherwise download it. */
export async function shareFile(url: string): Promise<void> {
  const { blob, name } = await fetchBlob(url);
  const file = new File([blob], name, { type: blob.type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file] }); return; } catch (e) { if ((e as Error)?.name === "AbortError") return; }
  }
  downloadBlob(blob, name);
}
