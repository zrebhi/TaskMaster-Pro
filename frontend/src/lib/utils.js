import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Returns today's date in YYYY-MM-DD format, respecting the user's local timezone.
 * This is suitable for the `min` or `max` attribute of an <input type="date">.
 * @returns {string} The formatted date string e.g., "2023-12-10".
 */
export function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}