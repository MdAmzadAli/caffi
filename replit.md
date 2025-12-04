# Caffi - Offline Caffeine Tracker

## Overview
Caffi is a privacy-first, offline caffeine tracking mobile app built with Expo React Native. It helps users monitor their daily caffeine intake, understand caffeine metabolism, and optimize sleep quality.

## Current State
- **Status**: MVP Complete - Functional prototype with all core features
- **Last Updated**: December 4, 2025
- **Platform**: Expo React Native (iOS, Android, Web)

## Project Architecture

### Directory Structure
```
/
├── App.tsx              # App entry with navigation & error boundary
├── app.json             # Expo configuration
├── navigation/          # React Navigation setup
│   ├── MainTabNavigator.tsx     # Bottom tabs with FAB
│   ├── HomeStackNavigator.tsx   # Home tab screens
│   ├── HistoryStackNavigator.tsx # History tab screens
│   └── SettingsStackNavigator.tsx # Settings tab screens
├── screens/             # Screen components
│   ├── HomeScreen.tsx           # Dashboard with caffeine ring
│   ├── HistoryScreen.tsx        # Timeline and stats
│   ├── SettingsScreen.tsx       # Profile & preferences
│   ├── StatisticsScreen.tsx     # Decay curve visualization
│   ├── DrinkDatabaseScreen.tsx  # Drink browser
│   ├── CustomDrinkScreen.tsx    # Add custom drinks
│   └── AddDrinkModal.tsx        # Quick add drink modal
├── components/          # Reusable UI components
│   ├── CaffeineRing.tsx        # Circular progress visualization
│   ├── CaffeineChart.tsx       # Bar chart for history
│   ├── CaffeineDecayCurve.tsx  # Half-life decay curve
│   ├── QuickStatCard.tsx       # Dashboard stat cards
│   ├── DrinkTimelineItem.tsx   # Swipeable drink entry
│   ├── Button.tsx              # Primary/secondary/tertiary buttons
│   ├── Card.tsx                # Elevation-based cards
│   ├── ThemedText.tsx          # Typography component
│   ├── ThemedView.tsx          # Themed container
│   ├── ErrorBoundary.tsx       # App crash recovery
│   └── ErrorFallback.tsx       # Error UI
├── store/               # State management
│   └── caffeineStore.ts        # In-memory caffeine data store
├── constants/           # Design tokens
│   └── theme.ts                # Colors, spacing, typography
└── hooks/               # Custom hooks
    ├── useTheme.ts             # Theme access
    ├── useScreenInsets.ts      # Safe area calculations
    └── useColorScheme.ts       # System color scheme
```

## Key Features

### Core Functionality
1. **Dashboard** - Circular caffeine ring showing daily intake vs limit
2. **Quick Stats** - Active caffeine, last drink, sleep impact badges
3. **Add Drink** - Modal with searchable drink database, size selection
4. **History** - Day/week view with timeline and bar charts
5. **Statistics** - Caffeine decay curve with half-life visualization
6. **Drink Database** - 20+ pre-loaded drinks with categories
7. **Custom Drinks** - Create personal caffeine entries
8. **Settings** - Profile, daily limit, sleep/wake times

### Design System
- **Theme**: Coffee-inspired warm tones
  - Background: #FFFFFF (white)
  - Light Coffee: #F5EBDD (cards)
  - Coffee Accent: #C69C6D (brand)
  - Dark Coffee: #6B4C3B (text)
  - Status colors: Success #2F9E44, Warning #F2A43A, Danger #E85D4E
- **Typography**: System fonts, sizes 12-32px
- **Spacing**: 8pt grid system
- **Radius**: 8-16px for cards and buttons

### Caffeine Logic
- Half-life model: 5 hours
- Decay calculation: `remaining = initial * 0.5^(hours/5)`
- Sleep impact: Based on predicted caffeine at sleep time
- Daily limit: Default 400mg (customizable)

## User Preferences
- No specific preferences documented yet

## Recent Changes
- December 4, 2025: Initial MVP build
  - Created complete UI with 7 screens
  - Implemented caffeine ring with animated progress
  - Built drink database with 20+ items
  - Added swipe-to-delete for drink entries
  - Created decay curve visualization
  - Implemented FAB for quick drink adding

## Technical Notes
- **State Management**: Custom hook-based store (no external library)
- **Data Persistence**: In-memory only (prototype phase)
- **Navigation**: React Navigation 7 with bottom tabs
- **Animations**: React Native Reanimated for smooth interactions
- **Charts**: Custom SVG-based visualizations with react-native-svg

## Next Steps (Future)
1. Add AsyncStorage for data persistence
2. Implement onboarding flow
3. Add dark mode support
4. Create local backup/export feature
5. Add notification system for limit warnings
