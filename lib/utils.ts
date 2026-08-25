import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return "Unknown";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return "Unscored";
  if (score >= 80) return "High Opportunity";
  if (score >= 60) return "Good Opportunity";
  if (score >= 40) return "Moderate Opportunity";
  return "Low Opportunity";
}

export function normalizeUrl(input: string): string {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return `${url.protocol}//${url.hostname}${url.pathname.replace(/\/$/, "")}`.toLowerCase();
  } catch {
    return input.trim().toLowerCase();
  }
}

export function extractDomain(input: string): string {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return input.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase();
  }
}
