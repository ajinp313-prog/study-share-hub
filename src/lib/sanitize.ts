/**
 * File-name and path sanitization utilities.
 *
 * These helpers harden file names before they are used as Supabase Storage
 * paths, preventing path-traversal attacks and storage-path injection.
 */

/**
 * Sanitize a file-name so it is safe to use in a storage path.
 *
 * Rules applied (in order):
 * 1. Strip null bytes.
 * 2. Strip leading dots and slashes (prevents `../` traversal).
 * 3. Replace any character that is not alphanumeric, dash, underscore, or dot
 *    with an underscore.
 * 4. Collapse consecutive underscores.
 * 5. Ensure the name is not empty (fall back to "file").
 * 6. Enforce a maximum length of 200 characters (before extension).
 */
export function sanitizeFileName(name: string): string {
    // 1. Remove null bytes
    let safe = name.replace(/\0/g, "");

    // 2. Strip leading path separators and dots (path traversal protection)
    safe = safe.replace(/^[./\\]+/, "");

    // 3. Replace unsafe characters with underscore
    safe = safe.replace(/[^a-zA-Z0-9._-]/g, "_");

    // 4. Collapse multiple consecutive underscores
    safe = safe.replace(/_+/g, "_");

    // 5. Fallback
    if (!safe || safe === ".") safe = "file";

    // 6. Limit total length to 200 chars
    if (safe.length > 200) {
        const ext = safe.lastIndexOf(".");
        const extension = ext !== -1 ? safe.slice(ext) : "";
        const base = safe.slice(0, Math.min(ext !== -1 ? ext : safe.length, 196));
        safe = base + extension;
    }

    return safe;
}

/**
 * Validate that a File is a genuine PDF by inspecting its magic bytes.
 *
 * A PDF file always begins with the 4-byte sequence: %PDF (0x25 0x50 0x44 0x46).
 * This prevents attackers from renaming a malicious file as ".pdf".
 *
 * @returns A promise that resolves to `true` if the file starts with %PDF.
 */
export async function isPdfMagicBytes(file: File): Promise<boolean> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const arr = new Uint8Array(e.target?.result as ArrayBuffer);
            // %PDF = 0x25 0x50 0x44 0x46
            const isPdf =
                arr[0] === 0x25 &&
                arr[1] === 0x50 &&
                arr[2] === 0x44 &&
                arr[3] === 0x46;
            resolve(isPdf);
        };
        reader.onerror = () => resolve(false);
        // Only read the first 4 bytes — efficient and sufficient.
        reader.readAsArrayBuffer(file.slice(0, 4));
    });
}
