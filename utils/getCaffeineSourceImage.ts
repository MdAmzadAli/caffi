// Utility to resolve caffeine source images from imageUri or category
// Handles both custom images and built-in category images

export function resolveImageSource(imageUri?: string): any {
  if (!imageUri) return null;
  
  if (imageUri.startsWith("preset:")) {
    const { PRESET_IMAGES } = require("@/components/ImagePickerModal");
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
