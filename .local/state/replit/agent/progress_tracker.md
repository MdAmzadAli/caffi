[x] COMPLETE: Project import migration to Replit environment

## IMPORT COMPLETED:
1. [x] Upgraded Node.js from v20.19.3 to v22.17.0 to meet package requirements
2. [x] Reinstalled npm packages with new Node version
3. [x] Restarted workflow - Expo is running successfully
4. [x] Verified project is working - web server running on port 5000

## FIXES COMPLETED:
5. [x] Fixed Quick Add section display showing incorrect quantity for ml units
   - Issue: Added "10 ml" but Quick Add showed "0.04 ml"
   - Fix: Updated RecentEntryItem servingLabel calculation to handle "ml" unit directly
   - File: screens/AddDrinkModal.tsx (line 934-936)

6. [x] Fixed radio options duplication in inbuilt source edit mode
   - Issue: When editing espresso saved with "ml" unit, showed "ml" and "ml" instead of "shot" and "ml"
   - Root cause: editEntry.unit was being used instead of getting default unit from database
   - Fix: Changed line 503 to always use getUnitForDrink() for consistency with add mode
   - File: components/CustomDrinkModal.tsx (line 503)
   - Result: Edit mode now shows same radio options as add mode (e.g., "shot" and "ml" for espresso)

## NOTES:
- All fixes are minimal and responsive
- App verified running on port 5000 with all changes live
- Both quick add display and inbuilt source edit modes working correctly

ALL FIXES COMPLETE ✓