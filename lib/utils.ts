import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency with Bangladeshi Taka symbol
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "৳"
): string {
  if (amount === null || amount === undefined) return `${currency}0.00`;
  return `${currency}${amount.toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Format date in various formats
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = "dd MMM yyyy"
): string {
  if (!date) return "-";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsedDate)) return "-";
  return format(parsedDate, formatStr);
}

// Format relative time
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsedDate)) return "-";
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

// Truncate text with ellipsis
export function truncateText(
  text: string | null | undefined,
  maxLength: number = 50
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Strip HTML tags from rich text
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "");
}

// Generate initials from name
export function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const words = name.split(" ").filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

// Get status color classes
export function getStatusColor(
  status: "ongoing" | "pending" | "completed" | "cancelled" | "paused" | string
): string {
  const colors: Record<string, string> = {
    ongoing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    paused: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  };
  return colors[status] || colors.pending;
}

// Get priority color classes
export function getPriorityColor(priority: "high" | "mid" | "low" | string): string {
  const colors: Record<string, string> = {
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    mid: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return colors[priority] || colors.mid;
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

// Convert number to Bangla numerals
export function toBanglaNumber(num: number | string): string {
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num)
    .split("")
    .map((d) => (d >= "0" && d <= "9" ? banglaDigits[parseInt(d)] : d))
    .join("");
}

// Calculate percentage
export function calculatePercentage(
  part: number | null | undefined,
  total: number | null | undefined
): number {
  if (!part || !total || total === 0) return 0;
  return Math.round((part / total) * 100);
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
