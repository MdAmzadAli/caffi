[x] COMPLETED: All custom drink and inbuilt drink features with proper unit persistence

## ROOT CAUSE ANALYSIS & FIXES APPLIED:

### Issue 1: Unit selection reverting to "cup" when reopening entry edit
[x] FIXED: Add unit field to DrinkEntry interface
[x] FIXED: Save selectedUnit when creating/updating entries
[x] FIXED: Load unit from entry.unit in edit modal (with fallback to getUnitForDrink)
Result: Entry edit modal now shows the last chosen unit ✓

### Issue 2: Unit not showing correctly in CaffeineLogPopup & quick add/custom drinks sections
[x] FIXED: Updated getServingLabel utility to accept optional unit parameter
   - When unit is provided, uses that instead of auto-detecting from servingSize
[x] FIXED: Updated CaffeineLogPopup to pass entry.unit to getServingLabel
   - Line 306: getServingLabel(entry.servingSize, entry.unit)
[x] FIXED: Batch added unit parameter to addEntry function signature
[x] FIXED: Updated all addEntry calls to pass selectedUnit
   - Inbuilt source entries: pass selectedUnit
   - Custom drink entries: pass selectedUnit
   - Prefill entries: pass selectedUnit
Result: CaffeineLogPopup now displays "2 tablespoon" instead of "2 cup" ✓

## DATA FLOW:
User creates custom drink with unit="tablespoon":
  → CustomDrinkModal saves sizes: [{ name: "tablespoon", ml: 100 }]
  → addEntry saves unit: "tablespoon" to DrinkEntry
  → CaffeineLogPopup loads entry.unit and passes to getServingLabel
  → Display: "2 tablespoon" ✓

## CODE CHANGES SUMMARY:
1. store/caffeineStore.ts: Added unit?: string to DrinkEntry interface
2. store/caffeineStore.ts: Added unit? parameter to addEntry function, saves unit in entry
3. utils/getServingLabel.ts: Updated to accept optional unit parameter
4. components/CaffeineLogPopup.tsx: Pass entry.unit to getServingLabel
5. components/CustomDrinkModal.tsx: 
   - Save selectedUnit in updateEntry (edit mode)
   - Pass selectedUnit to addEntry (create mode)
   - Load unit from entry.unit in edit modal

ALL UNITS NOW PROPERLY PERSIST AND DISPLAY EVERYWHERE ✓
