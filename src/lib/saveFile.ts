export type SaveFileResult = 'saved' | 'cancelled';

export interface SaveFileOptions {
  /** Suggested file name (may include user Path text as a hint). */
  suggestedName: string;
  contents: string | Blob;
  mimeType?: string;
}

function sanitizeFileName(name: string): string {
  const trimmed = name.trim().replace(/[/\\?%*:|"<>]/g, '-');
  return trimmed || 'export.txt';
}

/** Prefer basename when the user typed a folder-like path. */
export function suggestedNameFromPath(path: string | undefined, fallback: string): string {
  const raw = (path ?? '').trim();
  if (!raw) return sanitizeFileName(fallback);
  const parts = raw.replace(/\\/g, '/').split('/');
  const last = parts[parts.length - 1] || fallback;
  // If it looks like a directory (trailing slash / no extension), use fallback name.
  if (raw.endsWith('/') || raw.endsWith('\\') || !last.includes('.')) {
    return sanitizeFileName(fallback);
  }
  return sanitizeFileName(last);
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Open a native Save dialog when available (Chrome/Edge), else trigger a browser download.
 */
export async function saveFileWithPicker(opts: SaveFileOptions): Promise<SaveFileResult> {
  const fileName = sanitizeFileName(opts.suggestedName);
  const mimeType = opts.mimeType ?? 'text/plain';
  const blob =
    opts.contents instanceof Blob
      ? opts.contents
      : new Blob([opts.contents], { type: mimeType });

  const w = window as Window & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: { description?: string; accept: Record<string, string[]> }[];
    }) => Promise<{
      createWritable: () => Promise<{
        write: (data: Blob) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }>;
  };

  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'Export',
            accept: { [mimeType]: [`.${fileName.split('.').pop() || 'txt'}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (err) {
      // User cancelled, or API rejected (e.g. insecure context).
      if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'NotAllowedError')) {
        return 'cancelled';
      }
      // Fall through to download fallback for other failures.
    }
  }

  downloadBlob(blob, fileName);
  return 'saved';
}

export function mockExportContents(reportLabel: string, meta?: Record<string, unknown>): string {
  return [
    `Rubix Pension — mock export`,
    `Report: ${reportLabel}`,
    `Generated: ${new Date().toISOString()}`,
    meta ? `Params: ${JSON.stringify(meta, null, 2)}` : '',
    '',
    '(Placeholder file — real PDF/Excel export not implemented yet.)',
  ]
    .filter(Boolean)
    .join('\n');
}
