import { useState, useEffect } from 'react';

const TEA_IMAGE_MAP: { [key: string]: string } = {
  'black tea': 'https://images.unsplash.com/photo-1597318129255-7fa1ae3e4edc?w=200&h=200&fit=crop',
  'green tea': 'https://images.unsplash.com/photo-1597524766013-633340aa57f9?w=200&h=200&fit=crop',
  'white tea': 'https://images.unsplash.com/photo-1577318154e3fe4015616f2c2e6c3a1b?w=200&h=200&fit=crop',
  'oolong tea': 'https://images.unsplash.com/photo-1567318735868-e71b99932e29?w=200&h=200&fit=crop',
  'pu-erh tea': 'https://images.unsplash.com/photo-1597318129255-7fa1ae3e4edc?w=200&h=200&fit=crop',
  'herbal tea': 'https://images.unsplash.com/photo-1597524766013-633340aa57f9?w=200&h=200&fit=crop',
  'chamomile tea': 'https://images.unsplash.com/photo-1577318154e3fe4015616f2c2e6c3a1b?w=200&h=200&fit=crop',
  'peppermint tea': 'https://images.unsplash.com/photo-1567318735868-e71b99932e29?w=200&h=200&fit=crop',
  'ginger tea': 'https://images.unsplash.com/photo-1597318129255-7fa1ae3e4edc?w=200&h=200&fit=crop',
  'hibiscus tea': 'https://images.unsplash.com/photo-1597524766013-633340aa57f9?w=200&h=200&fit=crop',
};

export const useTeaImage = (teaName: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teaName) {
      setImageUrl(null);
      return;
    }

    const normalizedName = teaName.toLowerCase();
    
    // Direct lookup
    let url = TEA_IMAGE_MAP[normalizedName];
    
    // Partial match if direct lookup fails
    if (!url) {
      for (const [key, value] of Object.entries(TEA_IMAGE_MAP)) {
        if (normalizedName.includes(key) || key.includes(normalizedName)) {
          url = value;
          break;
        }
      }
    }
    
    setImageUrl(url || null);
    setLoading(false);
  }, [teaName]);

  return { imageUrl, loading };
};
