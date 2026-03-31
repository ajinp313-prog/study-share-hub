import { describe, it, expect } from "vitest";
import { z } from "zod";

// ── Replicate the schemas from AuthModal ──────────────────────────────────────
const signInSchema = z.object({
    identifier: z.string().trim().min(1, "Email or mobile number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSchema = z.object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
    email: z.string().trim().email("Invalid email address"),
    mobile: z
        .string()
        .trim()
        .min(10, "Mobile number must be at least 10 digits")
        .max(15, "Invalid mobile number")
        .regex(/^[0-9+\-\s]+$/, "Invalid mobile number format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    studyLevel: z.string().min(1, "Please select your study level"),
});

// ── signInSchema ──────────────────────────────────────────────────────────────
describe("signInSchema", () => {
    it("passes with valid email and strong password", () => {
        const result = signInSchema.safeParse({
            identifier: "test@example.com",
            password: "password123",
        });
        expect(result.success).toBe(true);
    });

    it("passes with mobile number and strong password", () => {
        const result = signInSchema.safeParse({
            identifier: "9876543210",
            password: "securePass1",
        });
        expect(result.success).toBe(true);
    });

    it("fails if identifier is empty", () => {
        const result = signInSchema.safeParse({ identifier: "  ", password: "password123" });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("required");
    });

    it("fails if password is shorter than 8 characters", () => {
        const result = signInSchema.safeParse({
            identifier: "test@example.com",
            password: "abc123",
        });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("8 characters");
    });

    it("fails if password is exactly 7 characters", () => {
        const result = signInSchema.safeParse({
            identifier: "test@example.com",
            password: "abc1234",
        });
        expect(result.success).toBe(false);
    });

    it("passes if password is exactly 8 characters", () => {
        const result = signInSchema.safeParse({
            identifier: "test@example.com",
            password: "abcd1234",
        });
        expect(result.success).toBe(true);
    });
});

// ── signUpSchema ──────────────────────────────────────────────────────────────
describe("signUpSchema", () => {
    const validPayload = {
        name: "Alice Smith",
        email: "alice@example.com",
        mobile: "9876543210",
        password: "securePass1",
        studyLevel: "Undergraduate",
    };

    it("passes with all valid fields", () => {
        const result = signUpSchema.safeParse(validPayload);
        expect(result.success).toBe(true);
    });

    it("fails if name is empty", () => {
        const result = signUpSchema.safeParse({ ...validPayload, name: "" });
        expect(result.success).toBe(false);
    });

    it("fails if name exceeds 100 characters", () => {
        const result = signUpSchema.safeParse({ ...validPayload, name: "A".repeat(101) });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("100 characters");
    });

    it("fails if email is invalid", () => {
        const result = signUpSchema.safeParse({ ...validPayload, email: "not-an-email" });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("Invalid email");
    });

    it("fails if mobile is fewer than 10 digits", () => {
        const result = signUpSchema.safeParse({ ...validPayload, mobile: "98765" });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("10 digits");
    });

    it("fails if mobile contains letters", () => {
        const result = signUpSchema.safeParse({ ...validPayload, mobile: "9876abcdef" });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("Invalid mobile number format");
    });

    it("passes mobile with + prefix and hyphens", () => {
        const result = signUpSchema.safeParse({ ...validPayload, mobile: "+91-9876543210" });
        expect(result.success).toBe(true);
    });

    it("fails if password is fewer than 8 characters", () => {
        const result = signUpSchema.safeParse({ ...validPayload, password: "short1" });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("8 characters");
    });

    it("fails if studyLevel is empty", () => {
        const result = signUpSchema.safeParse({ ...validPayload, studyLevel: "" });
        expect(result.success).toBe(false);
        const msg = (result as z.SafeParseError<unknown>).error.errors[0].message;
        expect(msg).toContain("study level");
    });
});
