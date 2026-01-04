import { useCaffeineStore } from "@/store/caffeineStore";
import { useCallback } from "react";

/**
 * Reusable hook to format dates according to the user's preferred format.
 * Syncs automatically with the selection from DateFormatPopup.
 */
export function useFormattedDate() {
  const { profile } = useCaffeineStore();
  const format = profile.dateFormat || "DD/MM/YYYY";

  const formatDate = useCallback((date: Date | string | number | undefined | null) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = monthNames[d.getMonth()];

    switch (format) {
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "DD.MM.YYYY":
        return `${day}. ${month}. ${year}`;
      case "DD MMM YYYY":
        return `${day} ${monthName} ${year}`;
      case "DD/MM/YYYY":
      default:
        return `${day}/${month}/${year}`;
    }
  }, [format]);

  return { formatDate, dateFormat: format };
}
