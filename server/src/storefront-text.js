const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

/** Linkify plain seller text without accepting HTML or executable URL schemes. */
export function linkedDescription(value) {
  return String(value ?? "").split(/\n\s*\n/).filter(Boolean).map((paragraph) => {
    const pattern = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
    let result = "", cursor = 0;
    for (const match of paragraph.matchAll(pattern)) {
      let label = match[0].replace(/[.,!?;:]+$/, "");
      for (const [open, close] of [["(", ")"], ["[", "]"], ["{", "}"]]) {
        while (label.endsWith(close) && label.split(close).length > label.split(open).length) label = label.slice(0, -1);
      }
      result += escapeHtml(paragraph.slice(cursor, match.index));
      try {
        const url = new URL(/^www\./i.test(label) ? `https://${label}` : label);
        if (!["http:", "https:"].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error("Invalid web link");
        result += `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer ugc">${escapeHtml(label)}</a>`;
      } catch { result += escapeHtml(label); }
      cursor = match.index + label.length;
    }
    return `<p>${result + escapeHtml(paragraph.slice(cursor))}</p>`;
  }).join("");
}
