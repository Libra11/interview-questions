/*
 * @Author: Libra
 * @Date: 2025-11-09 14:57:50
 * @LastEditTime: 2025-11-17 01:49:27
 * @LastEditors: Libra
 * @Description: 
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQuestionOrder(order?: number, fallback?: number) {
  const validatedOrder =
    typeof order === "number" && Number.isFinite(order) ? order : undefined;
  const validatedFallback =
    typeof fallback === "number" && Number.isFinite(fallback) ? fallback : undefined;
  const value = validatedOrder ?? validatedFallback;

  if (typeof value !== "number") {
    return "--";
  }

  const normalized = Math.max(1, Math.floor(value));
  return normalized >= 100 ? String(normalized) : String(normalized).padStart(2, "0");
}
