import { useCaffeineStore } from "@/store/caffeineStore";
import { useCallback } from "react";

/**
 * Reusable hook to format dates according to the user's preferred format and timezone.
 * Syncs automatically with the selection from DateFormatPopup and TimeZoneModal.
 */
export function useFormattedDate() {
  const { profile } = useCaffeineStore();
  const format = profile.dateFormat || "DD/MM/YYYY";
  const timezone = (profile as any).timezone || "Asia/Calcutta";

  const formatDate = useCallback((date: Date | string | number | undefined | null) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    // Format date in the selected timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const parts = formatter.formatToParts(d);
    const day = parts.find(p => p.type === 'day')?.value || String(d.getDate()).padStart(2, '0');
    const month = parts.find(p => p.type === 'month')?.value || String(d.getMonth() + 1).padStart(2, '0');
    const year = parts.find(p => p.type === 'year')?.value || String(d.getFullYear());

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month) - 1;
    const monthName = monthNames[monthIndex] || monthNames[0];

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
  }, [format, timezone]);

  return { formatDate, dateFormat: format };
}
