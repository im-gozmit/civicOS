import { describe, expect, it } from "vitest";
import { maskNumber, normalizeWhatsappNumber } from "@/lib/phone";

describe("optional WhatsApp number", () => {
  it("treats empty input as 'no number given', which is allowed", () => {
    expect(normalizeWhatsappNumber("")).toEqual({ kind: "none" });
    expect(normalizeWhatsappNumber("   ")).toEqual({ kind: "none" });
    expect(normalizeWhatsappNumber(undefined)).toEqual({ kind: "none" });
    expect(normalizeWhatsappNumber(null)).toEqual({ kind: "none" });
  });

  it("accepts Indian mobile numbers in the usual ways and adds the country code", () => {
    for (const raw of ["9876543210", "98765 43210", "98765-43210", "+91 98765 43210", "919876543210", "09876543210", "0091 9876543210"]) {
      expect(normalizeWhatsappNumber(raw)).toEqual({ kind: "ok", digits: "919876543210" });
    }
  });

  it("accepts a number typed with another country code", () => {
    expect(normalizeWhatsappNumber("+44 7911 123456")).toEqual({ kind: "ok", digits: "447911123456" });
  });

  it("rejects numbers that cannot be a mobile number", () => {
    for (const raw of ["12345", "5876543210", "abcdefghij", "98765", "9876543210123456789", "0000000000"]) {
      expect(normalizeWhatsappNumber(raw)).toEqual({ kind: "invalid" });
    }
  });

  it("masks a number so only the last three digits show", () => {
    expect(maskNumber("919876543210")).toBe("+91 ••••• ••210");
    expect(maskNumber("")).toBe("");
  });
});
