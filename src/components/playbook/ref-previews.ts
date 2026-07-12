import { getPreview, type RefPreview } from "@/lib/data";
import type { Playbook } from "@/lib/playbook/types";

/**
 * Build-time hover previews for every ref in a playbook, keyed by href.
 * Server components only: getPreview pulls the full corpus, which must never
 * be bundled into client code. Mirrors assessment/ref-previews.ts.
 */
export function buildPlaybookRefPreviews(playbook: Playbook): Record<string, RefPreview> {
  const out: Record<string, RefPreview> = {};
  const add = (href: string) => {
    if (out[href]) return;
    const preview = getPreview(href.replace(/\?[^#]*/, ""));
    if (preview) out[href] = preview;
  };
  for (const b of playbook.begrippen ?? []) add(b.href);
  for (const fase of playbook.fases) {
    for (const step of fase.stappen) for (const ref of step.refs) add(ref.href);
  }
  return out;
}
