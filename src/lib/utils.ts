import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDate, formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date();
  const timeDifferenceInSeconds = (currentDate.getTime() - from.getTime()) / 1000;
  const timeDifferenceInDays = timeDifferenceInSeconds / (24 * 60 * 60);

  if (timeDifferenceInSeconds < 60) {
    return "less than a minute ago";
  } else if (timeDifferenceInSeconds < 24 * 60 * 60) {
    return formatDistanceToNowStrict(from, { addSuffix: true });
  } else if (timeDifferenceInDays <= 14) {
    return `${Math.floor(timeDifferenceInDays)} day${Math.floor(timeDifferenceInDays) > 1 ? 's' : ''} ago`;
  } else {
    if (currentDate.getFullYear() === from.getFullYear()) {
      return formatDate(from, "MMM d");
    } else {
      return formatDate(from, "MMM d, yyyy");
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("en-IN", { 
    notation: "compact", 
    maximumFractionDigits: 1 
  }).format(n);
}
