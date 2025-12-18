import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY_PREFIX = 'tea_image_';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useTeaImage = (teaName: string) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeaImage = async () => {
      try {
        const cacheKey = CACHE_KEY_PREFIX + teaName.toLowerCase().replace(/\s+/g, '_');
        
        // Check cache first
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { url, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setImageUrl(url);
            setLoading(false);
            return;
          }
        }

        // Fetch image from search
        const searchQuery = `${teaName} tea type`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(
          `https://pixabay.com/api/?key=43948619&q=${encodeURIComponent(searchQuery)}&image_type=photo&orientation=square&safesearch=true&per_page=3`,
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.hits && data.hits.length > 0) {
            const url = data.hits[0].webformatURL;
            await AsyncStorage.setItem(cacheKey, JSON.stringify({ url, timestamp: Date.now() }));
            setImageUrl(url);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch tea image for ${teaName}:`, error);
      } finally {
        setLoading(false);
      }
    };

    if (teaName) {
      fetchTeaImage();
    }
  }, [teaName]);

  return { imageUrl, loading };
};
