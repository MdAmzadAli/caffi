import { useCaffeineStore } from "@/store/caffeineStore";
import { useCallback } from "react";

export function useFormattedTime() {
  const { profile } = useCaffeineStore();
  const timezone = (profile as any).timezone || "Asia/Calcutta";
  
  const formatTime = useCallback((date: Date | string | number) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";

    // Format time in the selected timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: profile.timeFormat !== "24-hour",
    });

    // We can directly use the formatter or formatToParts if we need more control
    if (profile.timeFormat === "24-hour") {
      const parts = formatter.formatToParts(d);
      const hours = parts.find(p => p.type === 'hour')?.value || '0';
      const minutes = parts.find(p => p.type === 'minute')?.value || '00';
      
      if (minutes === "00") return `${hours}`;
      return `${String(hours).padStart(2, "0")}:${minutes}`;
    } else {
      // For AM/PM, let Intl handle it but keep the custom logic for "no minutes" if requested
      const parts = formatter.formatToParts(d);
      const hours = parts.find(p => p.type === 'hour')?.value || '12';
      const minutes = parts.find(p => p.type === 'minute')?.value || '00';
      const period = parts.find(p => p.type === 'dayPeriod')?.value || '';
      
      if (minutes === "00") return `${hours}${period}`;
      return `${hours}:${minutes} ${period}`;
    }
  }, [profile.timeFormat, timezone]);

  return { formatTime, timeFormat: profile.timeFormat };
}
