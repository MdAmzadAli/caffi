import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import caffeineDB from "./newCaffeineDB.json";

export interface DrinkEntry {
  id: string;
  drinkId: string;
  name: string;
  caffeineAmount: number;
  servingSize: number;
  category: string;
  timestamp: Date;
  notes?: string;
  isFavorite?: boolean;
  imageUri?: string;
  unit?: string;
}

export interface DrinkItem {
  id: string;
  name: string;
  category: "coffee" | "tea" | "energy" | "soda" | "chocolate" | "custom";
  caffeinePer100ml: number;
  defaultServingMl: number;
  sizes?: { name: string; ml: number }[];
  icon: string;
  imageUri?: string;
}

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type CaffeineSensitivity = "low" | "medium" | "high";
export type SleepGoal = "good_sleep" | "normal_sleep" | "insomnia_prone";
export type AlcoholIntake = "rare" | "sometimes" | "daily";
export type AgeRange = "under_18" | "18_to_60" | "over_60";
export type Medication = "anxiety_panic" | "adhd_medication" | "insomnia_medication" | "acid_reflux" | "high_blood_pressure" | "depression_treatment" | "none";

export interface UserProfile {
  name: string;
  ageRange?: AgeRange;
  weight?: number;
  caffeineSensitivity?: CaffeineSensitivity;
  alcoholIntake?: AlcoholIntake;
  medications?: Medication[];
  wakeTime: string;
  sleepTime: string;
  dailyLimit: number;
  optimalCaffeine: number;
  safeCaffeine: number;
  isPregnant: boolean;
  hasHeartCondition: boolean;
  hasCompletedOnboarding: boolean;
}

export interface CaffeineCalculationInputs {
  age?: number;
  ageRange?: AgeRange;
  weight?: number;
  gender?: Gender;
  caffeineSensitivity?: CaffeineSensitivity;
  sleepGoal?: SleepGoal;
  alcoholIntake?: AlcoholIntake;
  medications?: Medication[];
  isPregnant?: boolean;
  hasHeartCondition?: boolean;
  onBirthControl?: boolean;
}

export function calculateOptimalCaffeine(inputs: CaffeineCalculationInputs): { optimal: number; safe: number } {
  let optimal = 200;
  let safe = 400;

  if (inputs.weight) {
    optimal = inputs.weight * 3;
    optimal = Math.min(optimal, 200);
    safe = Math.min(inputs.weight * 6, 400);
  }

  if (inputs.ageRange) {
    switch (inputs.ageRange) {
      case "over_60":
        optimal *= 0.8;
        break;
      case "under_18":
        if (inputs.weight) {
          optimal = inputs.weight * 2.5;
        } else {
          optimal = 80;
        }
        optimal = Math.min(optimal, 80);
        safe = 100;
        break;
    }
  }

  if (inputs.isPregnant) {
    optimal = Math.min(optimal, 200);
    safe = Math.min(safe, 200);
    optimal *= 0.5;
  }

  if (inputs.hasHeartCondition) {
    optimal = Math.min(optimal, 100);
    safe = Math.min(safe, 200);
  }

  if (inputs.caffeineSensitivity) {
    switch (inputs.caffeineSensitivity) {
      case "low":
        optimal *= 1.1;
        break;
      case "high":
        optimal *= 0.5;
        break;
    }
  }

  if (inputs.alcoholIntake) {
    switch (inputs.alcoholIntake) {
      case "sometimes":
        optimal *= 0.9;
        break;
      case "daily":
        optimal *= 0.85;
        break;
    }
  }

  if (inputs.medications && inputs.medications.length > 0 && !inputs.medications.includes("none")) {
    const medicationMultipliers: Record<Medication, number> = {
      anxiety_panic: 0.6,
      adhd_medication: 0.6,
      insomnia_medication: 0.6,
      acid_reflux: 0.75,
      high_blood_pressure: 0.7,
      depression_treatment: 0.7,
      none: 1,
    };

    let lowestMultiplier = 1;
    inputs.medications.forEach((med) => {
      const multiplier = medicationMultipliers[med] || 1;
      if (multiplier < lowestMultiplier) {
        lowestMultiplier = multiplier;
      }
    });
    optimal *= lowestMultiplier;
  }

  optimal = Math.round(optimal);
  optimal = Math.max(optimal, 70);
  optimal = Math.min(optimal, 200);
  safe = Math.round(safe);

  return { optimal, safe };
}

const CAFFEINE_HALF_LIFE_HOURS = 5;

const CATEGORY_MAP: Record<string, DrinkItem["category"]> = {
  "Coffee": "coffee",
  "Tea": "tea",
  "Energy Drinks": "energy",
  "Soft Drinks": "soda",
  "Chocolate": "chocolate",
};

const ICON_MAP: Record<DrinkItem["category"], string> = {
  coffee: "coffee",
  tea: "droplet",
  energy: "zap",
  soda: "droplet",
  chocolate: "square",
  custom: "plus",
};

export const DRINK_DATABASE: DrinkItem[] = Object.entries(caffeineDB).flatMap(
  ([categoryName, drinks]) => {
    const category = CATEGORY_MAP[categoryName];
    if (!category) return [];
    return drinks.map((drink: { name: string; serving_size_ml: number; caffeine_mg_per_ml: number | null }) => ({
      id: drink.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name: drink.name,
      category,
      caffeinePer100ml: parseFloat(((drink.caffeine_mg_per_ml ?? 0) * 100).toFixed(3)),
      defaultServingMl: drink.serving_size_ml,
      // sizes: [{ name: "Default", ml: drink.serving_size_ml }],
      icon: ICON_MAP[category],
    }));
  }
);

const STORAGE_KEYS = {
  PROFILE: "@caffi_profile",
  ENTRIES: "@caffi_entries",
  CUSTOM_DRINKS: "@caffi_custom_drinks",
  FAVORITES: "@caffi_favorites",
};

const DEFAULT_PROFILE: UserProfile = {
  name: "",
  dailyLimit: 400,
  optimalCaffeine: 200,
  safeCaffeine: 400,
  wakeTime: "07:00",
  sleepTime: "23:00",
  isPregnant: false,
  hasHeartCondition: false,
  hasCompletedOnboarding: false,
};

let globalEntries: DrinkEntry[] = [];
let globalProfile: UserProfile = { ...DEFAULT_PROFILE };
let globalCustomDrinks: DrinkItem[] = [];
let globalFavorites: string[] = [];
let globalListeners: (() => void)[] = [];
let isInitialized = false;

const notifyListeners = () => {
  globalListeners.forEach((listener) => listener());
};

const saveToStorage = async () => {
  try {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.PROFILE, JSON.stringify(globalProfile)],
      [STORAGE_KEYS.ENTRIES, JSON.stringify(globalEntries)],
      [STORAGE_KEYS.CUSTOM_DRINKS, JSON.stringify(globalCustomDrinks)],
      [STORAGE_KEYS.FAVORITES, JSON.stringify(globalFavorites)],
    ]);
  } catch (error) {
    console.error("Error saving to storage:", error);
  }
};

const loadFromStorage = async () => {
  try {
    const results = await AsyncStorage.multiGet([
      STORAGE_KEYS.PROFILE,
      STORAGE_KEYS.ENTRIES,
      STORAGE_KEYS.CUSTOM_DRINKS,
      STORAGE_KEYS.FAVORITES,
    ]);

    const profileData = results[0][1];
    const entriesData = results[1][1];
    const customDrinksData = results[2][1];
    const favoritesData = results[3][1];

    if (profileData) {
      globalProfile = JSON.parse(profileData);
    }
    if (entriesData) {
      globalEntries = JSON.parse(entriesData).map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    }
    if (customDrinksData) {
      globalCustomDrinks = JSON.parse(customDrinksData);
    }
    if (favoritesData) {
      globalFavorites = JSON.parse(favoritesData);
    }

    isInitialized = true;
    notifyListeners();
  } catch (error) {
    console.error("Error loading from storage:", error);
    isInitialized = true;
  }
};

loadFromStorage();

export function useCaffeineStore() {
  const [, setUpdate] = useState(0);

  const subscribe = useCallback(() => {
    const listener = () => setUpdate((n) => n + 1);
    globalListeners.push(listener);
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
    };
  }, []);

  useState(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  });

  const addEntry = useCallback(
    (
      drink: DrinkItem,
      servingSize: number,
      notes?: string,
      isFavorite?: boolean,
      timestamp?: Date,
      unit?: string,
      imageUri?: string,
    ) => {
      const caffeineAmount = drink.category === "custom" 
        ? Math.round((drink.caffeinePer100ml * servingSize) * 10) / 10
        : Math.round((drink.caffeinePer100ml * servingSize) / 100);
      const entry: DrinkEntry = {
        id: Date.now().toString(),
        drinkId: drink.id,
        name: drink.name,
        caffeineAmount,
        servingSize,
        category: drink.category,
        timestamp: timestamp || new Date(),
        notes,
        isFavorite,
        imageUri: imageUri || drink.imageUri,
        unit,
      };
      globalEntries = [entry, ...globalEntries];
      if (isFavorite && !globalFavorites.includes(drink.id)) {
        globalFavorites = [...globalFavorites, drink.id];
      }
      notifyListeners();
      saveToStorage();
      return entry;
    },
    [],
  );

  const deleteEntry = useCallback((id: string) => {
    globalEntries = globalEntries.filter((e) => e.id !== id);
    notifyListeners();
    saveToStorage();
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<DrinkEntry>) => {
    globalEntries = globalEntries.map((entry) => {
      if (entry.id === id) {
        return { ...entry, ...updates };
      }
      return entry;
    });
    notifyListeners();
    saveToStorage();
  }, []);

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    globalProfile = { ...globalProfile, ...updates };
    notifyListeners();
    saveToStorage();
  }, []);

  const addCustomDrink = useCallback((drink: Omit<DrinkItem, "id">, quantity?: number) => {
    const newDrink: DrinkItem = {
      ...drink,
      id: `custom-${Date.now()}`,
      defaultServingMl: quantity || drink.defaultServingMl,
      caffeinePer100ml: drink.caffeinePer100ml,
    };
    globalCustomDrinks = [...globalCustomDrinks, newDrink];
    notifyListeners();
    saveToStorage();
    return newDrink;
  }, []);

  const updateCustomDrink = useCallback((id: string, updates: Partial<DrinkItem>) => {
    globalCustomDrinks = globalCustomDrinks.map((drink) => {
      if (drink.id === id) {
        return { ...drink, ...updates };
      }
      return drink;
    });
    notifyListeners();
    saveToStorage();
  }, []);

  const toggleFavorite = useCallback((drinkId: string) => {
    if (globalFavorites.includes(drinkId)) {
      globalFavorites = globalFavorites.filter((id) => id !== drinkId);
    } else {
      globalFavorites = [...globalFavorites, drinkId];
    }
    notifyListeners();
    saveToStorage();
  }, []);

  const getTodayEntries = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return globalEntries.filter((e) => new Date(e.timestamp) >= today);
  }, []);

  const getTodayCaffeine = useCallback(() => {
    return getTodayEntries().reduce((sum, e) => sum + e.caffeineAmount, 0);
  }, [getTodayEntries]);

  const getActiveCaffeine = useCallback(() => {
    const now = new Date();
    let activeCaffeine = 0;

    globalEntries.forEach((entry) => {
      const hoursElapsed =
        (now.getTime() - new Date(entry.timestamp).getTime()) / (1000 * 60 * 60);
      if (hoursElapsed < 24) {
        const remainingFactor = Math.pow(
          0.5,
          hoursElapsed / CAFFEINE_HALF_LIFE_HOURS,
        );
        activeCaffeine += entry.caffeineAmount * remainingFactor;
      }
    });

    return Math.round(activeCaffeine);
  }, []);

  const getCaffeineAtTime = useCallback(
    (targetTime: Date) => {
      let caffeine = 0;

      globalEntries.forEach((entry) => {
        const entryTime = new Date(entry.timestamp);
        if (entryTime <= targetTime) {
          const hoursElapsed =
            (targetTime.getTime() - entryTime.getTime()) / (1000 * 60 * 60);
          const remainingFactor = Math.pow(
            0.5,
            hoursElapsed / CAFFEINE_HALF_LIFE_HOURS,
          );
          caffeine += entry.caffeineAmount * remainingFactor;
        }
      });

      return Math.round(caffeine);
    },
    [],
  );

  const getSleepImpact = useCallback(() => {
    const sleepHour = parseInt(globalProfile.sleepTime.split(":")[0]);
    const now = new Date();
    const sleepTime = new Date();
    sleepTime.setHours(sleepHour, 0, 0, 0);
    if (sleepTime <= now) {
      sleepTime.setDate(sleepTime.getDate() + 1);
    }

    const caffeineAtSleep = getCaffeineAtTime(sleepTime);

    if (caffeineAtSleep < 50) return { level: "good", message: "Sleep friendly" };
    if (caffeineAtSleep < 100)
      return { level: "warning", message: "May affect sleep" };
    return { level: "danger", message: "Will impact sleep" };
  }, [getCaffeineAtTime]);

  const getLastDrink = useCallback(() => {
    if (globalEntries.length === 0) return null;
    return globalEntries[0];
  }, []);

  const getEntriesForDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      return globalEntries.filter((e) => {
        const date = new Date(e.timestamp);
        return date >= startDate && date <= endDate;
      });
    },
    [],
  );

  const getAllDrinks = useCallback(() => {
    return [...DRINK_DATABASE, ...globalCustomDrinks];
  }, []);

  const getFavoriteDrinks = useCallback(() => {
    const allDrinks = getAllDrinks();
    return allDrinks.filter((d) => globalFavorites.includes(d.id));
  }, [getAllDrinks]);

  const resetData = useCallback(() => {
    globalEntries = [];
    globalCustomDrinks = [];
    globalFavorites = [];
    notifyListeners();
    saveToStorage();
  }, []);

  return {
    entries: globalEntries,
    profile: globalProfile,
    customDrinks: globalCustomDrinks,
    favorites: globalFavorites,
    isInitialized,
    addEntry,
    deleteEntry,
    updateEntry,
    updateProfile,
    addCustomDrink,
    updateCustomDrink,
    toggleFavorite,
    getTodayEntries,
    getTodayCaffeine,
    getActiveCaffeine,
    getCaffeineAtTime,
    getSleepImpact,
    getLastDrink,
    getEntriesForDateRange,
    getAllDrinks,
    getFavoriteDrinks,
    resetData,
  };
}
