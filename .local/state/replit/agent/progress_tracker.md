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
   - Fix: Changed line 503 to always use getUnitForDrink() for consistency with add mode
   - File: components/CustomDrinkModal.tsx (line 503)

7. [x] Fixed quantity field showing "1" instead of actual value when editing inbuilt ml entries
   - Root cause: servingSize storage differs by unit - ml entries store quantity directly, non-ml store quantity * defaultServingMl
   - Issue: Calculation always divided by perServingMg, ignoring the different storage pattern for ml units
   - Fix: Added unit check - if unit === "ml", use servingSize directly; otherwise divide by perServingMg
   - File: components/CustomDrinkModal.tsx (line 113-114)
   - Result: Edit mode now shows correct quantity (e.g., "10" instead of "1" for 10ml entries)

## NOTES:
- All fixes are minimal, responsive, and laser-focused
- App verified running on port 5000 with all changes live
- Three separate issues identified and fixed without touching other code
- Each fix is reusable and maintains consistency across add/edit flows

ALL FIXES COMPLETE ✓