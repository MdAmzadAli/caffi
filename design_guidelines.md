# Caffi - Design Guidelines

## Architecture

### Authentication
**No authentication required** - This is an offline-first, privacy-focused app. All data stored locally using AsyncStorage. Display privacy message in Settings: "Your data never leaves this device."

### Navigation Structure
**Bottom Tab Navigation** with 4 tabs + centered FAB:
- **Home** (Dashboard) - Main caffeine tracking view
- **Add** (Centered FAB) - Quick drink entry (64px circular button)
- **History** - Timeline and statistics
- **Settings** - Profile and preferences

**Navigation Flow:**
- Onboarding (3 slides) → Dashboard
- All modals slide up with backdrop dim
- Standard back gestures for nested screens

## Visual Design System

### Color Palette
```
Background White: #FFFFFF
Light Coffee (cards/panels): #F5EBDD
Coffee Accent (brand): #C69C6D
Dark Coffee (text/icons): #6B4C3B
Muted Text: #5A5A5A
Success: #2F9E44
Warning: #F2A43A
Danger: #E85D4E
Divider: #EFEFEF
```

### Typography
- **Font Family:** Inter (fallback: Poppins)
- **Sizes:** Title 20-24px, Subtitle 16px, Body 14px, Small 12px
- **Primary Text:** #6B4C3B (dark coffee)
- **Secondary Text:** #5A5A5A (muted)

### Spacing & Layout
- **Grid:** 8pt baseline
- **Horizontal Padding:** 16px
- **Card Radius:** 12-16px
- **Button Radius:** 8px
- **Elevation:** Subtle shadow (y: 2-4px, blur: 8-12px)

## Screen Specifications

### 1. Onboarding (3 Slides)
- **Purpose:** Explain privacy, tracking, sleep benefits
- **Layout:** Full-screen slides with warm coffee gradient strip, simple illustrations
- **Form:** Optional inputs (age, weight, wake/sleep hours) with "Skip" option
- **CTA:** "Get started" primary button

### 2. Home/Dashboard
- **Header:** Greeting + date (transparent background)
- **Main Content:** 
  - Large circular caffeine ring (220px diameter, shows mg/limit %)
  - Ring accent: #C69C6D, track: #EFEFEF
  - Horizontal chips: Today/24h/Week
  - Quick stats row: Active caffeine, Last drink, Sleep impact
- **Bottom:** Mini timeline (today's drinks with time, icon, mg)
- **Empty State:** Friendly message with FAB prompt
- **Safe Area:** Top inset = headerHeight + 24px, Bottom = tabBarHeight + 24px

### 3. Add Drink Modal
- **Trigger:** FAB or Add button
- **Layout:** Full-screen modal slide-up
- **Header:** Search box at top
- **Content:** 
  - Categorized quick-pick cards (Coffee, Tea, Energy, Soda, Chocolate, Custom)
  - Starbucks size dropdown (Tall, Grande, Venti, Short)
  - Manual input fields with live mg calculation preview
  - Toggle: "Mark as favorite"
- **Validation:** Inline warning if mg > 80% daily limit
- **CTAs:** "Add to today" (primary) + "Cancel"

### 4. Drink Database
- **Header:** Search + category filter chips
- **Content:** Scrollable list grouped by category
- **List Items:** Icon, name, standard mg/100ml, quick-add plus icon
- **Interaction:** Long-press for details modal
- **Empty State:** "No results. Try different word."

### 5. History/Timeline
- **Header:** Calendar selector (Day/Week toggle)
- **Graph:** Hourly bar/line chart showing mg over time
- **List:** Drink entries with swipe actions (left: delete, right: edit)
- **Weekly View:** Totals, average, sleep correlation card

### 6. Statistics Screen
- **Content:** Interactive caffeine-in-blood decay curve
- **Toggle:** Show half-life vs Simplified view
- **Display:** Predicted safe sleep time

### 7. Custom Drink Editor
- **Form Fields:** Name, category, caffeine per 100ml/serving, default size
- **Preview:** Live consumption values
- **CTA:** Save button

### 8. Settings
- **Sections:**
  - Profile: Age, Weight, Pregnancy toggle
  - Daily Limit: Input (default 400mg)
  - Notifications: Toggles for alerts, sleep warnings
  - Data: Export/Reset (local only)
  - Privacy: Reassurance message
  - About & Help

## Component Library

### Buttons
- **Primary:** Filled #C69C6D, height 44-52px, radius 8px
- **Secondary:** Outlined, same dimensions
- **Tertiary:** Text only
- **Disabled:** 50% opacity
- **Tap Targets:** Minimum 44x44px

### FAB (Floating Action Button)
- **Size:** 64px circular
- **Position:** Centered above tab bar
- **Color:** #C69C6D with white plus icon
- **Shadow:** y: 2px, opacity: 0.10, radius: 2px

### Cards
- **Background:** White on #F5EBDD panels
- **Radius:** 12px
- **Padding:** 12-16px
- **Shadow:** Soft elevation

### Input Fields
- **Height:** 44-56px
- **Radius:** 10-12px
- **Left icon support**

### Progress Rings
- **Dashboard:** 220px diameter
- **Compact:** 140px diameter
- **Track:** #EFEFEF, Fill: #C69C6D

### Icons
- **Style:** Simple line + filled (Feather icons from @expo/vector-icons)
- **Set:** coffee, tea, energy drink, soda, chocolate, favorite, delete, edit, history, settings, plus

## Interactions & Animations

- **Ring Fill:** Ease-in-out animation
- **Timeline Entries:** Fade/slide on add
- **FAB Press:** Small bounce
- **Swipe Actions:** Left (delete), Right (edit)
- **Pull-to-Refresh:** On Database and History
- **Modal Transitions:** Slide-up with backdrop dim
- **Success Toast:** "Drink added" with auto-dismiss
- **Delete Undo:** Snackbar with UNDO button

## Warnings & Alerts

- **80% Limit:** Warning color (#F2A43A) with suggestion
- **Over Limit:** Danger color (#E85D4E) with modal
- **Sleep Impact:** Badge for caffeine after 4 PM
- **Copy:** "Caffeine logged after 4 PM may affect sleep tonight"

## Accessibility

- **Contrast Ratio:** ≥4.5:1 for body text
- **Tap Targets:** ≥44x44px
- **Dynamic Type:** Support font scaling
- **Visual Feedback:** All touchable elements show press state