// Utility to resolve caffeine source images from imageUri or category
// Handles both custom images and built-in category images

const PRESET_IMAGES = [
  { id: "latte", name: "Latte", image: require("@/assets/images/drinks/latte.jpg") },
  { id: "coffee-cup", name: "Coffee Cup", image: require("@/assets/images/drinks/coffee-cup.jpg") },
  { id: "cappuccino", name: "Cappuccino", image: require("@/assets/images/drinks/cappuccino.jpg") },
  { id: "takeaway", name: "Takeaway", image: require("@/assets/images/drinks/takeaway.jpg") },
  { id: "mocha", name: "Mocha", image: require("@/assets/images/drinks/mocha.jpg") },
  { id: "french-press", name: "French Press", image: require("@/assets/images/drinks/french-press.jpg") },
  { id: "chocolate", name: "Chocolate", image: require("@/assets/images/drinks/chocolate.jpg") },
  { id: "matcha", name: "Matcha", image: require("@/assets/images/drinks/matcha.jpg") },
];

export function resolveImageSource(imageUri?: string): any {
  if (!imageUri) return null;
  
  if (imageUri.startsWith("preset:")) {
    const preset = PRESET_IMAGES.find((p: any) => p.id === imageUri.replace("preset:", ""));
    return preset?.image;
  }
  
  // File URI from device
  return { uri: imageUri };
}

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
