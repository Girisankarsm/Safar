export function isNightHour(hour: number): boolean {
  return hour >= 22 || hour < 5;
}

export function isPeakHour(hour: number): boolean {
  return (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
}

/** Safety modifier for route scoring (-20 night … +15 daytime) */
export function timeSafetyModifier(hour: number): number {
  if (isNightHour(hour)) return -20;
  if (hour >= 20 || hour < 7) return -10;
  if (isPeakHour(hour)) return 8;
  return 15;
}

export function timeSafetyLabel(hour: number): string {
  if (isNightHour(hour)) return "Night travel — higher risk, prefer well-lit routes";
  if (hour >= 20 || hour < 7) return "Evening/early morning — moderate lighting risk";
  if (isPeakHour(hour)) return "Peak hour — crowded, generally safer";
  return "Daytime — best visibility and crowd safety";
}

export function formatDepartureLabel(hour: number): string {
  const h = hour % 24;
  const suffix = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}:00 ${suffix}`;
}
