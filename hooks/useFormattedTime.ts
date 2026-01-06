import { useCaffeineStore } from "@/store/caffeineStore";

export function useFormattedTime() {
  const { profile } = useCaffeineStore();
  
  const formatTime = (date: Date | string | number) => {
    const d = new Date(date);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    
    if (profile.timeFormat === "24-hour") {
      if (minutes === 0) return `${hours}`;
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    } else {
      const period = hours >= 12 ? "PM" : "AM";
      let h12 = hours % 12;
      if (h12 === 0) h12 = 12;
      if (minutes === 0) return `${h12}${period}`;
      return `${h12}:${String(minutes).padStart(2, "0")} ${period}`;
    }
  };

  return { formatTime, timeFormat: profile.timeFormat };
}
