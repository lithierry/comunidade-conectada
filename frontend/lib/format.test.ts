import { describe, expect, it, vi } from "vitest";

import { formatRelativeDate } from "./format";

describe("formatRelativeDate", () => {
    it("returns a fallback when the date is missing", () => {
        expect(formatRelativeDate()).toBe("Data não informada");
    });

    it("returns a fallback when the date is invalid", () => {
        expect(formatRelativeDate("invalid-date")).toBe(
            "Data não informada",
        );
    });

    it("formats recent publications", () => {
        vi.useFakeTimers();

        vi.setSystemTime(
            new Date("2026-08-12T10:00:00Z"),
        );

        expect(
            formatRelativeDate("2026-08-12T09:59:00Z"),
        ).toBe("Publicado há 1 minuto");

        vi.useRealTimers();
    });

    it("formats publications in days", () => {
        vi.useFakeTimers();

        vi.setSystemTime(
            new Date("2026-08-12T10:00:00Z"),
        );

        expect(
            formatRelativeDate("2026-08-10T10:00:00Z"),
        ).toBe("Publicado há 2 dias");

        vi.useRealTimers();
    });
});