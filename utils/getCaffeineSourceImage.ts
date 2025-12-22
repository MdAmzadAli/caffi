// Utility to get the correct image for a caffeine source category
// Used in both ConsumptionList and CaffeineLogPopup for consistency

export function getCaffeineSourceImage(category: string): any {
  const categoryImages: Record<string, any> = {
    coffee: require("@/assets/CaffeineSourceImages/coffee.png"),
    tea: require("@/assets/CaffeineSourceImages/tea.jpg"),
    energy: require("@/assets/CaffeineSourceImages/energy.png"),
    soda: require("@/assets/CaffeineSourceImages/soda.png"),
    chocolate: require("@/assets/CaffeineSourceImages/chocolate.png"),
  };
  
  return categoryImages[category] || null;
}
