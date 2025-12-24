[x] COMPLETE: Project import migration to Replit environment

## IMPORT COMPLETED:
1. [x] Upgraded Node.js from v20.19.3 to v22.17.0 to meet package requirements
2. [x] Reinstalled npm packages with new Node version
3. [x] Restarted workflow - Expo is running successfully
4. [x] Verified project is working - web server running on port 5000

## FIXES COMPLETED:
5. [x] Fixed Quick Add section display showing incorrect quantity for ml units
6. [x] Fixed radio options duplication in inbuilt source edit mode
7. [x] Fixed quantity field showing "1" instead of actual value when editing inbuilt ml entries
8. [x] Fixed caffeine calculation for edited inbuilt ml entries
9. [x] Changed "drinking" to "eating" for chocolate
10. [x] Fixed duplicate entry unit loss in CaffeineLogPopup display
11. [x] Fixed missing image in duplicated caffeine entries
12. [x] Removed quantity limit in CustomDrinkModal

## LATEST CHANGES (Current Session):
13. [x] Fixed custom drink logging behavior
    - When clicking a custom drink from "My Custom Drinks", only quantity and finishing time are editable
    - Name and image fields are now disabled/read-only but display with FULL opacity (exactly as before)
    - Caffeine mg field remains disabled when in logging mode
    - All fields remain visible with original design/styling when in logging mode
    - Edit button functionality remains unchanged for editing drink definitions
    - File: screens/AddDrinkModal.tsx (added isLoggingCustomDrink state)
    - File: components/CustomDrinkModal.tsx (removed opacity styling, kept disabled/editable props)
    - Changes are laser-focused and minimal - pure functionality, no design changes
    - Design remains responsive on all screen sizes

14. [x] FIXED: Custom drink duplication when logging from "MY CUSTOM DRINKS" section
    - ROOT CAUSE: Line 335 in CustomDrinkModal.tsx had condition `!prefillDrink.id.startsWith('custom-')`
      which only handled inbuilt drinks, causing custom drinks to fall through to else block
      which called `addCustomDrink()` and created duplicate entries
    - FIX: Changed condition from `prefillDrink?.id && !prefillDrink.id.startsWith('custom-')`
      to `prefillDrink?.id` to handle both custom and inbuilt drinks in logging/prefill mode
    - NOW: "MY CUSTOM DRINKS" section only grows when user explicitly creates new drink via '+' button
    - Existing custom drinks can be logged without creating duplicates
    - Changes are minimal (1 line) and responsive on all screen sizes

ALL FIXES COMPLETE ✓