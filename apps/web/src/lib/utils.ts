import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safetyColor(score: number) {
  if (score >= 75) return "text-[#22C55E]";
  if (score >= 50) return "text-[#3B82F6]";
  return "text-[#EF4444]";
}
