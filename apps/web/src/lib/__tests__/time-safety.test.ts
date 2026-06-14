import { describe, expect, it } from "vitest";
import {
  formatDepartureLabel,
  isNightHour,
  isPeakHour,
  timeSafetyModifier,
} from "../time-safety";

describe("isNightHour", () => {
  it("returns true for late night hours", () => {
    expect(isNightHour(22)).toBe(true);
    expect(isNightHour(23)).toBe(true);
    expect(isNightHour(0)).toBe(true);
    expect(isNightHour(4)).toBe(true);
  });

  it("returns false for daytime hours", () => {
    expect(isNightHour(5)).toBe(false);
    expect(isNightHour(12)).toBe(false);
    expect(isNightHour(21)).toBe(false);
  });
});

describe("isPeakHour", () => {
  it("returns true for morning peak", () => {
    expect(isPeakHour(8)).toBe(true);
    expect(isPeakHour(9)).toBe(true);
    expect(isPeakHour(10)).toBe(true);
  });

  it("returns true for evening peak", () => {
    expect(isPeakHour(17)).toBe(true);
    expect(isPeakHour(19)).toBe(true);
    expect(isPeakHour(20)).toBe(true);
  });

  it("returns false for off-peak hours", () => {
    expect(isPeakHour(11)).toBe(false);
    expect(isPeakHour(14)).toBe(false);
    expect(isPeakHour(21)).toBe(false);
  });
});

describe("timeSafetyModifier", () => {
  it("returns -20 for night hours", () => {
    expect(timeSafetyModifier(23)).toBe(-20);
    expect(timeSafetyModifier(2)).toBe(-20);
  });

  it("returns positive modifier for peak daytime hours", () => {
    expect(timeSafetyModifier(9)).toBe(8);
    expect(timeSafetyModifier(18)).toBe(8);
  });

  it("returns highest modifier for safe daytime hours", () => {
    expect(timeSafetyModifier(12)).toBe(15);
    expect(timeSafetyModifier(14)).toBe(15);
  });
});

describe("formatDepartureLabel", () => {
  it("formats midnight correctly", () => {
    expect(formatDepartureLabel(0)).toBe("12:00 AM");
  });

  it("formats noon correctly", () => {
    expect(formatDepartureLabel(12)).toBe("12:00 PM");
  });

  it("formats afternoon correctly", () => {
    expect(formatDepartureLabel(15)).toBe("3:00 PM");
  });

  it("formats early morning correctly", () => {
    expect(formatDepartureLabel(8)).toBe("8:00 AM");
  });

  it("wraps 24-hour values", () => {
    expect(formatDepartureLabel(24)).toBe("12:00 AM");
  });
});
