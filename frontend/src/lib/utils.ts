import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safetyColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 65) return "text-lime-400";
  if (score >= 45) return "text-amber-400";
  return "text-rose-400";
}
