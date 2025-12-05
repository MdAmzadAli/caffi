import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
}

export interface DrinkItem {
  id: string;
  name: string;
  category: "coffee" | "tea" | "energy" | "soda" | "chocolate" | "custom";
  caffeinePer100ml: number;
  defaultServingMl: number;
  sizes?: { name: string; ml: number }[];
  icon: string;
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
        optimal = 80;
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
  optimal = Math.max(optimal, 50);
  optimal = Math.min(optimal, 200);
  safe = Math.round(safe);

  return { optimal, safe };
}

const CAFFEINE_HALF_LIFE_HOURS = 5;

export const DRINK_DATABASE: DrinkItem[] = [
  {
    id: "espresso",
    name: "Espresso",
    category: "coffee",
    caffeinePer100ml: 212,
    defaultServingMl: 30,
    sizes: [
      { name: "Single", ml: 30 },
      { name: "Double", ml: 60 },
    ],
    icon: "coffee",
  },
  {
    id: "drip-coffee",
    name: "Drip Coffee",
    category: "coffee",
    caffeinePer100ml: 40,
    defaultServingMl: 240,
    sizes: [
      { name: "Small", ml: 240 },
      { name: "Medium", ml: 350 },
      { name: "Large", ml: 470 },
    ],
    icon: "coffee",
  },
  {
    id: "starbucks-pike",
    name: "Starbucks Pike Place",
    category: "coffee",
    caffeinePer100ml: 47,
    defaultServingMl: 350,
    sizes: [
      { name: "Short", ml: 240 },
      { name: "Tall", ml: 350 },
      { name: "Grande", ml: 470 },
      { name: "Venti", ml: 590 },
    ],
    icon: "coffee",
  },
  {
    id: "latte",
    name: "Latte",
    category: "coffee",
    caffeinePer100ml: 25,
    defaultServingMl: 350,
    sizes: [
      { name: "Short", ml: 240 },
      { name: "Tall", ml: 350 },
      { name: "Grande", ml: 470 },
      { name: "Venti", ml: 590 },
    ],
    icon: "coffee",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    category: "coffee",
    caffeinePer100ml: 32,
    defaultServingMl: 240,
    sizes: [
      { name: "Small", ml: 180 },
      { name: "Medium", ml: 240 },
      { name: "Large", ml: 350 },
    ],
    icon: "coffee",
  },
  {
    id: "cold-brew",
    name: "Cold Brew",
    category: "coffee",
    caffeinePer100ml: 65,
    defaultServingMl: 350,
    sizes: [
      { name: "Tall", ml: 350 },
      { name: "Grande", ml: 470 },
      { name: "Venti", ml: 590 },
    ],
    icon: "coffee",
  },
  {
    id: "americano",
    name: "Americano",
    category: "coffee",
    caffeinePer100ml: 35,
    defaultServingMl: 350,
    sizes: [
      { name: "Short", ml: 240 },
      { name: "Tall", ml: 350 },
      { name: "Grande", ml: 470 },
    ],
    icon: "coffee",
  },
  {
    id: "black-tea",
    name: "Black Tea",
    category: "tea",
    caffeinePer100ml: 20,
    defaultServingMl: 240,
    sizes: [
      { name: "Cup", ml: 240 },
      { name: "Mug", ml: 350 },
    ],
    icon: "droplet",
  },
  {
    id: "green-tea",
    name: "Green Tea",
    category: "tea",
    caffeinePer100ml: 12,
    defaultServingMl: 240,
    sizes: [
      { name: "Cup", ml: 240 },
      { name: "Mug", ml: 350 },
    ],
    icon: "droplet",
  },
  {
    id: "matcha",
    name: "Matcha Latte",
    category: "tea",
    caffeinePer100ml: 25,
    defaultServingMl: 350,
    sizes: [
      { name: "Tall", ml: 350 },
      { name: "Grande", ml: 470 },
    ],
    icon: "droplet",
  },
  {
    id: "chai-tea",
    name: "Chai Tea Latte",
    category: "tea",
    caffeinePer100ml: 15,
    defaultServingMl: 350,
    sizes: [
      { name: "Tall", ml: 350 },
      { name: "Grande", ml: 470 },
    ],
    icon: "droplet",
  },
  {
    id: "redbull",
    name: "Red Bull",
    category: "energy",
    caffeinePer100ml: 32,
    defaultServingMl: 250,
    sizes: [
      { name: "Regular", ml: 250 },
      { name: "Large", ml: 355 },
    ],
    icon: "zap",
  },
  {
    id: "monster",
    name: "Monster Energy",
    category: "energy",
    caffeinePer100ml: 32,
    defaultServingMl: 473,
    sizes: [{ name: "Can", ml: 473 }],
    icon: "zap",
  },
  {
    id: "celsius",
    name: "Celsius",
    category: "energy",
    caffeinePer100ml: 67,
    defaultServingMl: 355,
    sizes: [{ name: "Can", ml: 355 }],
    icon: "zap",
  },
  {
    id: "coca-cola",
    name: "Coca-Cola",
    category: "soda",
    caffeinePer100ml: 10,
    defaultServingMl: 355,
    sizes: [
      { name: "Can", ml: 355 },
      { name: "Bottle", ml: 500 },
    ],
    icon: "droplet",
  },
  {
    id: "pepsi",
    name: "Pepsi",
    category: "soda",
    caffeinePer100ml: 10,
    defaultServingMl: 355,
    sizes: [
      { name: "Can", ml: 355 },
      { name: "Bottle", ml: 500 },
    ],
    icon: "droplet",
  },
  {
    id: "mountain-dew",
    name: "Mountain Dew",
    category: "soda",
    caffeinePer100ml: 15,
    defaultServingMl: 355,
    sizes: [
      { name: "Can", ml: 355 },
      { name: "Bottle", ml: 500 },
    ],
    icon: "droplet",
  },
  {
    id: "dark-chocolate",
    name: "Dark Chocolate (70%)",
    category: "chocolate",
    caffeinePer100ml: 80,
    defaultServingMl: 40,
    sizes: [
      { name: "Small Bar", ml: 40 },
      { name: "Large Bar", ml: 100 },
    ],
    icon: "square",
  },
  {
    id: "milk-chocolate",
    name: "Milk Chocolate",
    category: "chocolate",
    caffeinePer100ml: 20,
    defaultServingMl: 40,
    sizes: [
      { name: "Small Bar", ml: 40 },
      { name: "Large Bar", ml: 100 },
    ],
    icon: "square",
  },
  {
    id: "hot-chocolate",
    name: "Hot Chocolate",
    category: "chocolate",
    caffeinePer100ml: 5,
    defaultServingMl: 240,
    sizes: [
      { name: "Cup", ml: 240 },
      { name: "Large", ml: 350 },
    ],
    icon: "square",
  },
];

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
    ) => {
      const caffeineAmount = Math.round(
        (drink.caffeinePer100ml * servingSize) / 100,
      );
      const entry: DrinkEntry = {
        id: Date.now().toString(),
        drinkId: drink.id,
        name: drink.name,
        caffeineAmount,
        servingSize,
        category: drink.category,
        timestamp: new Date(),
        notes,
        isFavorite,
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

  const addCustomDrink = useCallback((drink: Omit<DrinkItem, "id">) => {
    const newDrink: DrinkItem = {
      ...drink,
      id: `custom-${Date.now()}`,
    };
    globalCustomDrinks = [...globalCustomDrinks, newDrink];
    notifyListeners();
    saveToStorage();
    return newDrink;
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
