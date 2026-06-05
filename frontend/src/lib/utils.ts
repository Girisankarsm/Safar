import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safetyColor(score: number) {
  if (score >= 75) return "text-accent bg-green-50 border-green-200";
  if (score >= 50) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-danger bg-red-50 border-red-200";
}

export function routeTypeLabel(type: string) {
  const labels: Record<string, string> = {
    fastest: "Fastest",
    safest: "Safest",
    greenest: "Greenest",
  };
  return labels[type] ?? type;
}
