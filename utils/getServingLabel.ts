// Utility to format serving size into a human-readable label
// Used to show dynamic serving amounts like "2 cups", "3 tablespoon", "250 ml"

export function getServingLabel(servingSize: number, unit?: string, defaultServingMl?: number): { quantity: string; unit: string } {
  // If unit is provided, use it with calculated quantity
  if (unit) {
    const divisor = defaultServingMl || 100;
    const quantity = servingSize / divisor;
    const formattedQty = quantity.toFixed(2).replace(/\.?0+$/, "");
    return {
      quantity: formattedQty,
      unit: unit,
    };
  }

  // If >= 100 ml: convert to cups (divide by 100)
  if (servingSize >= 100) {
    const cups = servingSize / 100;
    const formattedCups = cups.toFixed(2).replace(/\.?0+$/, "");
    return {
      quantity: formattedCups,
      unit: cups === 1 ? "cup" : "cups",
    };
  }

  // Otherwise: show in ml
  return {
    quantity: servingSize.toString(),
    unit: servingSize === 1 ? "ml" : "ml",
  };
}
