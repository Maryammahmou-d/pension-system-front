export type SaveFileResult = 'saved' | 'cancelled';

export interface SaveFileOptions {
  /** Suggested file name (may include user Path text as a hint). */
  suggestedName: string;
  contents: string | Blob;
  mimeType?: string;
}

export function sanitizeFileName(name: string): string {
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

function isFileLockedError(err: unknown): boolean {
  if (!(err instanceof DOMException) && !(err instanceof Error)) return false;
  const name = 'name' in err ? String(err.name) : '';
  const message = (err.message || '').toLowerCase();
  return (
    name === 'NoModificationAllowedError' ||
    name === 'NotAllowedError' ||
    name === 'InvalidStateError' ||
    name === 'NotFoundError' ||
    message.includes('not allowed') ||
    message.includes('access denied') ||
    message.includes('cannot create a file') ||
    message.includes('being used') ||
    message.includes('locked')
  );
}

type FileWritable = {
  write: (data: Blob) => Promise<void>;
  truncate?: (size: number) => Promise<void>;
  close: () => Promise<void>;
};

type WritableFileHandle = {
  createWritable: (options?: { keepExistingData?: boolean }) => Promise<FileWritable>;
};

type RemovableFileHandle = WritableFileHandle & {
  getFile?: () => Promise<{ size: number }>;
  remove?: () => Promise<void>;
};

async function writeFileHandle(handle: WritableFileHandle, contents: Blob): Promise<void> {
  // Must call createWritable on the handle. Passing the method unbound throws Illegal invocation.
  const writable = await handle.createWritable({ keepExistingData: false });
  try {
    if (typeof writable.truncate === 'function') {
      await writable.truncate(0);
    }
    await writable.write(contents);
  } finally {
    await writable.close();
  }
}

export async function writeSaveLocation(
  location: Exclude<SaveLocation, { mode: 'cancelled' }>,
  contents: Blob,
): Promise<void> {
  if (location.mode === 'handle') {
    try {
      await location.write(contents);
      return;
    } catch (err) {
      if (!isFileLockedError(err)) throw err;
      // Excel (or another app) still has the file open — overwrite is blocked on Windows.
      downloadBlob(contents, location.fileName);
      throw new Error(
        'Could not replace the existing file because it is open (close it in Excel and try again). A new copy was downloaded instead.',
      );
    }
  }
  downloadBlob(contents, location.fileName);
}

/**
 * Remove an empty Save-As placeholder created by the browser when extract fails
 * before any content was written. Existing non-empty files are left alone.
 */
export async function discardUnusedSaveLocation(
  location: Exclude<SaveLocation, { mode: 'cancelled' }>,
): Promise<void> {
  if (location.mode !== 'handle' || !location.discardIfEmpty) return;
  try {
    await location.discardIfEmpty();
  } catch {
    // Ignore cleanup failures.
  }
}

/**
 * Open a native Save dialog when available (Chrome/Edge), else trigger a browser download.
 */
export async function saveFileWithPicker(opts: SaveFileOptions): Promise<SaveFileResult> {
  const target = await requestSaveLocation(opts);
  if (target.mode === 'cancelled') return 'cancelled';
  const blob =
    opts.contents instanceof Blob
      ? opts.contents
      : new Blob([opts.contents], { type: opts.mimeType ?? 'text/plain' });
  await writeSaveLocation(target, blob);
  return 'saved';
}

export type SaveLocation =
  | {
      mode: 'handle';
      fileName: string;
      write: (contents: Blob) => Promise<void>;
      discardIfEmpty: () => Promise<void>;
    }
  | { mode: 'download'; fileName: string }
  | { mode: 'cancelled' };

/** Call this directly from a click handler so the browser still treats it as a user gesture. */
export async function requestSaveLocation(opts: {
  suggestedName: string;
  mimeType?: string;
}): Promise<SaveLocation> {
  const fileName = sanitizeFileName(opts.suggestedName);
  const mimeType = opts.mimeType ?? 'text/plain';

  const w = window as Window & {
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: { description?: string; accept: Record<string, string[]> }[];
    }) => Promise<RemovableFileHandle>;
  };

  if (typeof w.showSaveFilePicker === 'function') {
    try {
      const ext = (fileName.split('.').pop() || 'pdf').toLowerCase();
      const description =
        ext === 'xlsx' ? 'Excel workbook' : ext === 'zip' ? 'ZIP archive' : 'PDF';
      const handle = await w.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description,
            accept: { [mimeType]: [`.${ext}`] },
          },
        ],
      });
      return {
        mode: 'handle',
        fileName,
        write: async (contents: Blob) => {
          await writeFileHandle(handle, contents);
        },
        discardIfEmpty: async () => {
          try {
            if (typeof handle.getFile === 'function') {
              const file = await handle.getFile();
              if (file.size > 0) return;
            }
            if (typeof handle.remove === 'function') {
              await handle.remove();
            }
          } catch {
            // Ignore cleanup failures.
          }
        },
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { mode: 'cancelled' };
      }
      // Gesture lost / blocked — do not silently fall back to Downloads.
      if (
        err instanceof DOMException &&
        (err.name === 'SecurityError' || err.name === 'NotAllowedError')
      ) {
        return { mode: 'cancelled' };
      }
    }
  }

  return { mode: 'download', fileName };
}

export type DirectoryHandleLike = {
  name: string;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<{
    name: string;
    getFileHandle: (
      name: string,
      options?: { create?: boolean },
    ) => Promise<WritableFileHandle>;
  }>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<WritableFileHandle>;
};

export type DirectoryLocation =
  | {
      mode: 'directory';
      name: string;
      writeFile: (fileName: string, contents: Blob) => Promise<void>;
      createNamedSubfolder: (folderName: string) => Promise<{
        name: string;
        writeFile: (fileName: string, contents: Blob) => Promise<void>;
      }>;
    }
  | { mode: 'cancelled' }
  | { mode: 'unsupported' };

/**
 * Ask the user for a destination folder (Chrome/Edge). Cancel → cancelled.
 * Call from a user gesture (click handler) so the picker is allowed.
 */
export async function requestDirectoryLocation(): Promise<DirectoryLocation> {
  const w = window as Window & {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
    }) => Promise<DirectoryHandleLike>;
  };

  if (typeof w.showDirectoryPicker !== 'function') {
    return { mode: 'unsupported' };
  }

  try {
    // Must be invoked from a user-gesture click handler (not after a network await).
    const dir = await w.showDirectoryPicker({ mode: 'readwrite' });
    return {
      mode: 'directory',
      name: dir.name,
      writeFile: async (fileName: string, contents: Blob) => {
        const handle = await dir.getFileHandle(sanitizeFileName(fileName), { create: true });
        await writeFileHandle(handle, contents);
      },
      createNamedSubfolder: async (folderName: string) => {
        const safe = sanitizeFileName(folderName);
        const sub = await dir.getDirectoryHandle(safe, { create: true });
        return {
          name: sub.name || safe,
          writeFile: async (fileName: string, contents: Blob) => {
            const handle = await sub.getFileHandle(sanitizeFileName(fileName), { create: true });
            await writeFileHandle(handle, contents);
          },
        };
      },
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { mode: 'cancelled' };
    }
    // SecurityError / NotAllowedError = lost user gesture or permission denied.
    return { mode: 'unsupported' };
  }
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
