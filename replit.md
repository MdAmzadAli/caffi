# Caffi - Offline Caffeine Tracker

## Overview
Caffi is a privacy-first, offline caffeine tracking mobile app built with Expo React Native. It helps users monitor their daily caffeine intake, understand caffeine metabolism, and optimize sleep quality.

## Current State
- **Status**: MVP Complete - Functional prototype with all core features
- **Last Updated**: December 17, 2025
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
│   ├── SettingsStackNavigator.tsx # Settings tab screens
│   └── StatsStackNavigator.tsx  # Stats tab screens
├── screens/             # Screen components
│   ├── HomeScreen.tsx           # Dashboard with caffeine ring
│   ├── HistoryScreen.tsx        # Timeline and stats
│   ├── SettingsScreen.tsx       # Profile & preferences
│   ├── StatisticsScreen.tsx     # Analytics overview
│   ├── CaffeineIntakeDetailScreen.tsx # Caffeine intake bar chart
│   ├── DrinkDatabaseScreen.tsx  # Drink browser
│   ├── CustomDrinkScreen.tsx    # Add custom drinks
│   └── AddDrinkModal.tsx        # Quick add drink modal
├── components/          # Reusable UI components
│   ├── CaffeineRing.tsx        # Circular progress visualization
│   ├── CaffeineChart.tsx       # Bar chart for history
│   ├── CaffeineDecayCurve.tsx  # Half-life decay curve
│   ├── QuickStatCard.tsx       # Dashboard stat cards
│   ├── DrinkTimelineItem.tsx   # Drink entry with delete icon
│   ├── EditDrinkModal.tsx      # Edit drink modal
│   ├── Button.tsx              # Primary/secondary/tertiary buttons
│   ├── Card.tsx                # Elevation-based cards
│   ├── ThemedText.tsx          # Typography component
│   ├── ThemedView.tsx          # Themed container
│   ├── ErrorBoundary.tsx       # App crash recovery
│   └── ErrorFallback.tsx       # Error UI
├── store/               # State management
│   └── caffeineStore.ts        # AsyncStorage-backed caffeine data store
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
- Age selection: Simple 3-option choice instead of precise age slider
- Weight input: Numeric keyboard input instead of slider
- Caffeine sensitivity: "Normal" preferred over "Medium" label
- Alcohol intake: "Never" preferred over "Rare" label

## Recent Changes
- December 17, 2025: Graph legend and optimal caffeine line
  - Added horizontal dashed line showing user's optimal caffeine level (gold/accent color)
  - Removed "Sleep unaffected" text from graph
  - Added info icon (i) at top left of graph that opens legend modal
  - Legend explains: green line = sleep threshold, gold dashed line = optimal daily caffeine
  - Passes optimalCaffeineMg through HomeScreen -> HomeGraphController -> CaffeineGraphNew

- December 17, 2025: Infinite scrolling for home screen caffeine graph
  - Added CaffeineGraphNew component with virtualized day-window rendering
  - Shows 5 days at a time (prev 3 days, current day, next day) for performance
  - Edge detection extends window by 5 days when user scrolls to boundaries
  - Scroll position preserved when day window extends (no jumping)
  - Arrow buttons appear when scrolled away from current time, clicking returns to now
  - Date labels shown below x-axis only at midnight (day boundaries)
  - HomeGraphController manages day window state and reset functionality

- December 16, 2025: Improved sleep impact indicator logic and explanatory text cards
  - Sleep impact now checks maximum caffeine level during 6-hour sleep window (not just at exact sleep time)
  - Added getMaxCaffeineInSleepWindow() function in graphUtils.ts
  - Added explanatory text cards below Caffeine Limit and Sleep Impact indicators
  - Text dynamically shows meaning based on indicator color (green/orange/red)
  - Caffeine Limit: "Supports alertness and focus" / "May cause mild restlessness" / "Side effects more likely"
  - Sleep Impact: "Unlikely to disrupt sleep" / "May disrupt sleep for some" / "More likely to disrupt sleep"

- December 11, 2025: Caffeine Intake Analytics Detail Screen
  - Added CaffeineIntakeDetailScreen with interactive bar chart
  - Week/Month/Year period selector for viewing consumption patterns
  - Date range navigator with arrows to browse previous/next periods
  - Bar graph shows daily intake (week), weekly totals (month), or monthly totals (year)
  - Average calculation displayed below chart
  - Created StatsStackNavigator for navigation from StatisticsScreen
  - Clickable "Daily caffeine intake" card in Analytics navigates to detail view

- December 5, 2025: Real-time updates and edit functionality
  - Fixed HomeScreen not updating in real-time when drinks are added/deleted
  - Added visible delete icon on each drink entry (red trash icon)
  - Simplified DrinkTimelineItem component for better touch handling
  - Added EditDrinkModal for editing existing drink logs
  - Added updateEntry function to caffeineStore for modifying entries
  - Tapping a drink entry now opens edit modal to modify serving size, caffeine amount, or notes
  - All changes (add, edit, delete) now reflect instantly on both Home and History screens

- December 4, 2025: Data persistence and schedule step
  - Added AsyncStorage persistence for all app data
  - Added non-skippable schedule step (wake/sleep times) to onboarding
  - Home screen caffeine ring now shows personalized optimal limit

- December 4, 2025: Custom onboarding flow
  - Replaced age slider with 3 options: Under 18, 18-60, Over 60
  - Changed weight input from slider to numeric text keyboard
  - Changed "Medium" sensitivity to "Normal"
  - Changed "Rare" alcohol to "Never"
  - Removed gender and sleep goal steps entirely
  - Updated medications with 6 specific conditions + None option:
    - Anxiety/Panic (0.6x reduction)
    - Depression treatment (0.7x reduction)
    - ADHD medication (0.6x reduction)
    - High blood pressure (0.7x reduction)
    - Insomnia medication (0.6x reduction)
    - Acid reflux (0.75x reduction)
  - Age-based caffeine limits:
    - Under 18: optimal=80mg, safe=100mg fixed
    - 18-60: full calculated amount
    - Over 60: optimal multiplied by 0.8x

- December 4, 2025: Initial MVP build
  - Created complete UI with 7 screens
  - Implemented caffeine ring with animated progress
  - Built drink database with 20+ items
  - Added swipe-to-delete for drink entries
  - Created decay curve visualization
  - Implemented FAB for quick drink adding

## Technical Notes
- **State Management**: Custom hook-based store with global state and listeners
- **Data Persistence**: AsyncStorage for profile, entries, custom drinks, favorites
- **Navigation**: React Navigation 7 with bottom tabs
- **Animations**: React Native Reanimated for smooth interactions
- **Charts**: Custom SVG-based visualizations with react-native-svg

## Next Steps (Future)
1. Add dark mode support
2. Create local backup/export feature
3. Add notification system for limit warnings
