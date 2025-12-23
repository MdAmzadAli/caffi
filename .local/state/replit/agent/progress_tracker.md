[x] COMPLETE: Project import migration to Replit environment

## IMPORT COMPLETED:
1. [x] Upgraded Node.js from v20.19.3 to v22.17.0 to meet package requirements
2. [x] Reinstalled npm packages with new Node version
3. [x] Restarted workflow - Expo is running successfully
4. [x] Verified project is working - web server running on port 5000

## FIXES COMPLETED:
5. [x] Fixed Quick Add section display showing incorrect quantity for ml units
   - File: screens/AddDrinkModal.tsx (line 934-936)

6. [x] Fixed radio options duplication in inbuilt source edit mode
   - File: components/CustomDrinkModal.tsx (line 503)

7. [x] Fixed quantity field showing "1" instead of actual value when editing inbuilt ml entries
   - File: components/CustomDrinkModal.tsx (line 113-114)

8. [x] Fixed caffeine calculation for edited inbuilt ml entries
   - Root cause: totalCaffeine calculation didn't account for editing inbuilt sources with ml unit, and servingSize wasn't unit-aware
   - Issue: When user changed 10ml entry to 9ml, caffeine was calculated using shot values instead of ml values
   - Fix 1: Updated totalCaffeine useMemo (lines 179-190) - now checks for isEditingInbuiltSource && selectedUnit === "ml" and uses correct caffeinePer100ml
   - Fix 2: Updated servingSize calculation (line 322) - now checks selectedUnit, uses quantity directly if ml, otherwise multiplies by defaultServingMl
   - Result: Saving edited ml entries now calculates correct caffeine amount

## NOTES:
- All fixes are minimal, responsive, and laser-focused
- Four separate issues identified and fixed
- App verified running on port 5000 with all changes live
- Each fix is reusable and maintains consistency across add/edit flows

ALL FIXES COMPLETE ✓