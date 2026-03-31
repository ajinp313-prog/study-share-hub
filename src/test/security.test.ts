import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeFileName, isPdfMagicBytes } from "@/lib/sanitize";

// ── sanitizeFileName ──────────────────────────────────────────────────────────
describe("sanitizeFileName", () => {
    it("returns a safe name for a normal PDF file", () => {
        expect(sanitizeFileName("my-notes.pdf")).toBe("my-notes.pdf");
    });

    it("strips leading path-traversal sequences (../)", () => {
        const result = sanitizeFileName("../../../etc/passwd.pdf");
        expect(result).not.toContain("..");
        expect(result).not.toContain("/");
    });

    it("strips leading dot-slash (./) sequences", () => {
        const result = sanitizeFileName("./secret.pdf");
        expect(result).not.toContain("./");
    });

    it("replaces spaces with underscores", () => {
        expect(sanitizeFileName("my notes file.pdf")).toBe("my_notes_file.pdf");
    });

    it("replaces special characters with underscores", () => {
        const result = sanitizeFileName("file$(rm -rf).pdf");
        expect(result).not.toMatch(/[$()]/);
    });

    it("removes null bytes", () => {
        const result = sanitizeFileName("evil\0file.pdf");
        expect(result).not.toContain("\0");
    });

    it("collapses consecutive underscores", () => {
        expect(sanitizeFileName("my___file.pdf")).toBe("my_file.pdf");
    });

    it("falls back to 'file' for empty or dot-only names", () => {
        expect(sanitizeFileName("")).toBe("file");
        expect(sanitizeFileName(".")).toBe("file");
    });

    it("produces a name no longer than 200 characters", () => {
        const longName = "a".repeat(250) + ".pdf";
        const result = sanitizeFileName(longName);
        expect(result.length).toBeLessThanOrEqual(200);
    });
});

// ── isPdfMagicBytes ───────────────────────────────────────────────────────────
describe("isPdfMagicBytes", () => {
    /**
     * Helper that creates a File whose content starts with the given bytes.
     */
    const makeFile = (bytes: number[]): File => {
        const buf = new Uint8Array(bytes);
        return new File([buf], "test.file", { type: "application/octet-stream" });
    };

    it("returns true for a file starting with %PDF magic bytes", async () => {
        // %PDF = 0x25 0x50 0x44 0x46
        const pdfFile = makeFile([0x25, 0x50, 0x44, 0x46, 0x00, 0x00]);
        const result = await isPdfMagicBytes(pdfFile);
        expect(result).toBe(true);
    });

    it("returns false for a JPEG file (starts with FFD8FF)", async () => {
        const jpegFile = makeFile([0xff, 0xd8, 0xff, 0xe0, 0x00]);
        const result = await isPdfMagicBytes(jpegFile);
        expect(result).toBe(false);
    });

    it("returns false for a PNG file (starts with 89504E47)", async () => {
        const pngFile = makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d]);
        const result = await isPdfMagicBytes(pngFile);
        expect(result).toBe(false);
    });

    it("returns false for an empty file", async () => {
        const emptyFile = new File([], "empty.pdf", { type: "application/pdf" });
        const result = await isPdfMagicBytes(emptyFile);
        expect(result).toBe(false);
    });

    it("returns false for a file with only 3 bytes (incomplete magic)", async () => {
        const shortFile = makeFile([0x25, 0x50, 0x44]);
        const result = await isPdfMagicBytes(shortFile);
        expect(result).toBe(false);
    });
});

// ── Session upload counter (logic-level unit test) ───────────────────────────
// We test the counter logic in isolation without mounting a React component.
describe("Session upload limit logic", () => {
    const SESSION_UPLOAD_LIMIT = 10;
    let count = 0;

    beforeEach(() => {
        count = 0;
    });

    const simulateUpload = (): { blocked: boolean } => {
        if (count >= SESSION_UPLOAD_LIMIT) return { blocked: true };
        count++;
        return { blocked: false };
    };

    it("allows uploads below the session limit", () => {
        for (let i = 0; i < SESSION_UPLOAD_LIMIT; i++) {
            expect(simulateUpload().blocked).toBe(false);
        }
        expect(count).toBe(SESSION_UPLOAD_LIMIT);
    });

    it("blocks uploads that exceed the session limit", () => {
        // Fill the counter
        for (let i = 0; i < SESSION_UPLOAD_LIMIT; i++) simulateUpload();
        // This one should be blocked
        expect(simulateUpload().blocked).toBe(true);
    });
});

// ── Login rate-limit countdown logic ─────────────────────────────────────────
describe("Login rate-limit logic", () => {
    const MAX_ATTEMPTS = 3;
    const LOCKOUT_MS = 30_000;

    let attempts = 0;
    let lockoutUntil: number | null = null;

    beforeEach(() => {
        attempts = 0;
        lockoutUntil = null;
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const tryLogin = (success: boolean) => {
        if (lockoutUntil && Date.now() < lockoutUntil) return "locked";
        if (!success) {
            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
                lockoutUntil = Date.now() + LOCKOUT_MS;
            }
            return "failed";
        }
        attempts = 0;
        lockoutUntil = null;
        return "success";
    };

    it("allows login attempts below the threshold", () => {
        expect(tryLogin(false)).toBe("failed");
        expect(tryLogin(false)).toBe("failed");
        // Third attempt triggers lockout but still returns "failed" (not "locked" yet)
        expect(tryLogin(false)).toBe("failed");
    });

    it("locks out after MAX_ATTEMPTS consecutive failures", () => {
        for (let i = 0; i < MAX_ATTEMPTS; i++) tryLogin(false);
        // Next attempt is within the lockout window
        expect(tryLogin(false)).toBe("locked");
    });

    it("allows login after the lockout window expires", () => {
        for (let i = 0; i < MAX_ATTEMPTS; i++) tryLogin(false);
        // Advance time past the lockout
        vi.advanceTimersByTime(LOCKOUT_MS + 1);
        expect(tryLogin(true)).toBe("success");
    });

    it("resets the counter on successful login", () => {
        tryLogin(false);
        tryLogin(false);
        tryLogin(true); // success — resets counter
        expect(attempts).toBe(0);
        expect(lockoutUntil).toBeNull();
    });
});
