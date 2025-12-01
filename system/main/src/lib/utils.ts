import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProfilePictureUrl(path: string | null | undefined) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `http://localhost:5000${path}`;
}
