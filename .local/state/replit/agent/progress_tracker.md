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

## SESSION 2 FIXES:
13. [x] Fixed custom drink logging behavior
14. [x] Fixed custom drink duplication when logging from "MY CUSTOM DRINKS"
15. [x] Fixed custom drink duplication when editing and logging
16. [x] Fixed AddDrinkModal showing old custom drink data after edit

## SESSION 3 FIXES:
17. [x] Fixed quantity resets to 1 when transitioning from custom drink edit to logging mode
18. [x] Fixed quantity display (4.74 cups → 2 cups) by reverting problematic spread
19. [x] FIXED: Modified name not reflecting in Consumption Log for inbuilt sources
    - ROOT CAUSE: addEntry was using original prefillDrink.name, not the modified drinkName
    - SOLUTION: Capture entry from addEntry, then conditionally update name via updateEntry
    - FIX: Only update name if drinkName differs from prefillDrink.name
      `const entry = addEntry(...);`
      `if (drinkName.trim() !== prefillDrink.name) { updateEntry(entry.id, { name: drinkName.trim() }); }`
    - RESULT: Modified names now properly reflect in Consumption Log while preserving quantity accuracy
    - CHANGES: Minimal (3 lines), laser-focused, reusable pattern
    - RESPONSIVE: Full design responsiveness maintained
    - File: components/CustomDrinkModal.tsx (lines 348-351)
    - Workflow: Restarted and verified running on port 5000

ALL FIXES COMPLETE ✓
- Quantity displays correctly
- Modified names display correctly
- Modified images display correctly
- Full responsive design maintained