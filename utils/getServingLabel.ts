// Utility to format serving size into a human-readable label
// Used to show dynamic serving amounts like "2 cups", "3 tablespoon", "250 ml"

export function getServingLabel(servingSize: number): { quantity: string; unit: string } {
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
