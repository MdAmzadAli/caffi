import { DrinkEntry } from "@/store/caffeineStore";

// Generate dummy entries with varying dates
const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
const threeDaysAgo = new Date(today);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
const fourDaysAgo = new Date(today);
fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
const fiveDaysAgo = new Date(today);
fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
const sixDaysAgo = new Date(today);
sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

export const DUMMY_ENTRIES: DrinkEntry[] = [
  // Today
  {
    id: "dummy-1",
    drinkId: "espresso-1",
    name: "Espresso",
    caffeineAmount: 77,
    servingSize: 30,
    category: "coffee",
    timestamp: new Date(today.getTime() + 19 * 3600000 + 33 * 60000), // 7:33 PM
  },
  {
    id: "dummy-2",
    drinkId: "latte-1",
    name: "Latte",
    caffeineAmount: 95,
    servingSize: 240,
    category: "coffee",
    timestamp: new Date(today.getTime() + 14 * 3600000 + 15 * 60000), // 2:15 PM
  },
  {
    id: "dummy-3",
    drinkId: "americano-1",
    name: "Americano",
    caffeineAmount: 150,
    servingSize: 355,
    category: "coffee",
    timestamp: new Date(today.getTime() + 10 * 3600000 + 45 * 60000), // 10:45 AM
  },
  
  // Yesterday
  {
    id: "dummy-4",
    drinkId: "bnk-1",
    name: "Bnk",
    caffeineAmount: 20,
    servingSize: 250,
    category: "coffee",
    timestamp: new Date(yesterday.getTime() + 6 * 3600000 + 16 * 60000), // 6:16 AM
  },
  {
    id: "dummy-5",
    drinkId: "green-tea-1",
    name: "Green Tea",
    caffeineAmount: 30,
    servingSize: 240,
    category: "tea",
    timestamp: new Date(yesterday.getTime() + 15 * 3600000 + 30 * 60000), // 3:30 PM
  },
  
  // 2 days ago (Saturday, 06/12/2025)
  {
    id: "dummy-6",
    drinkId: "cghu-1",
    name: "Cghu",
    caffeineAmount: 200,
    servingSize: 500,
    category: "coffee",
    timestamp: new Date(twoDaysAgo.getTime() + 22 * 3600000 + 24 * 60000), // 10:24 PM
  },
  {
    id: "dummy-7",
    drinkId: "drip-coffee-1",
    name: "Drip coffee",
    caffeineAmount: 95,
    servingSize: 240,
    category: "coffee",
    timestamp: new Date(twoDaysAgo.getTime() + 18 * 3600000 + 23 * 60000), // 6:23 PM
  },
  {
    id: "dummy-8",
    drinkId: "cappuccino-1",
    name: "Cappuccino",
    caffeineAmount: 80,
    servingSize: 180,
    category: "coffee",
    timestamp: new Date(twoDaysAgo.getTime() + 8 * 3600000 + 10 * 60000), // 8:10 AM
  },
  
  // 3 days ago
  {
    id: "dummy-9",
    drinkId: "red-bull-1",
    name: "Red Bull",
    caffeineAmount: 80,
    servingSize: 250,
    category: "energy",
    timestamp: new Date(threeDaysAgo.getTime() + 12 * 3600000 + 0 * 60000), // 12:00 PM
  },
  {
    id: "dummy-10",
    drinkId: "matcha-1",
    name: "Matcha",
    caffeineAmount: 70,
    servingSize: 240,
    category: "tea",
    timestamp: new Date(threeDaysAgo.getTime() + 9 * 3600000 + 30 * 60000), // 9:30 AM
  },
  
  // 4 days ago
  {
    id: "dummy-11",
    drinkId: "cold-brew-1",
    name: "Cold Brew",
    caffeineAmount: 200,
    servingSize: 355,
    category: "coffee",
    timestamp: new Date(fourDaysAgo.getTime() + 16 * 3600000 + 45 * 60000), // 4:45 PM
  },
  
  // 5 days ago
  {
    id: "dummy-12",
    drinkId: "coca-cola-1",
    name: "Coca Cola",
    caffeineAmount: 34,
    servingSize: 355,
    category: "soda",
    timestamp: new Date(fiveDaysAgo.getTime() + 13 * 3600000 + 20 * 60000), // 1:20 PM
  },
  
  // 6 days ago
  {
    id: "dummy-13",
    drinkId: "dark-chocolate-1",
    name: "Dark Chocolate",
    caffeineAmount: 12,
    servingSize: 100,
    category: "chocolate",
    timestamp: new Date(sixDaysAgo.getTime() + 20 * 3600000 + 0 * 60000), // 8:00 PM
  },
  {
    id: "dummy-14",
    drinkId: "mocha-1",
    name: "Mocha",
    caffeineAmount: 95,
    servingSize: 355,
    category: "coffee",
    timestamp: new Date(sixDaysAgo.getTime() + 11 * 3600000 + 15 * 60000), // 11:15 AM
  },
];









