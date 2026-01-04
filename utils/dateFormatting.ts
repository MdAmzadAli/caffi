export function formatTime(date: Date, format: "AM/PM" | "24-hour"): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (format === "24-hour") {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
  
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export function formatHourOnly(date: Date, format: "AM/PM" | "24-hour"): string {
  const hours = date.getHours();
  
  if (format === "24-hour") {
    return `${String(hours).padStart(2, "0")}:00`;
  }
  
  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}${ampm}`;
}
