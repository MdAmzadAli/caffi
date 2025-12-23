[x] COMPLETE: Inbuilt caffeine sources now display exact quantity with proper unit handling

## ROOT CAUSE ANALYSIS:
For inbuilt sources with "cup" unit:
- When adding: servingSize = defaultServingMl * quantity (e.g., 237 * 2 = 474)
- When displaying with getServingLabel(474, "cup"): divided by 100 → "4.74 cup" (WRONG!)
- Should divide by defaultServingMl → "2 cup" (CORRECT!)

## FIX APPLIED:
1. Updated getServingLabel signature:
   - Added defaultServingMl?: number parameter
   - Logic: if unit provided, divisor = defaultServingMl || 100
   - For inbuilt with "cup": divisor = 237
   - For custom drinks: divisor = 100

2. Updated CaffeineLogPopup header:
   - Looks up drink from DRINK_DATABASE
   - Gets defaultServingMl
   - Passes to getServingLabel for correct calculation

3. Updated RecentEntryItem (Quick Add section):
   - Looks up drink from DRINK_DATABASE
   - Gets defaultServingMl
   - Uses correct divisor for quantity calculation

## DATA FLOW:
User adds "2 cup of instant coffee":
→ addEntry saves: servingSize=474, unit="cup"
→ CaffeineLogPopup loads: looks up defaultServingMl=237
→ getServingLabel(474, "cup", 237) = 474/237 = 2 cup ✓
→ Quick Add shows: "2 cup" ✓

## EDITING BEHAVIOR:
User edits entry:
→ Edit modal recovers: qty = servingSize / defaultServingMl = 474 / 237 = 2
→ Shows quantity=2 with radio="cup" and mg=124 ✓
→ On save, updates stored correctly ✓

## COVERAGE:
[x] Inbuilt sources show exact quantity (no conversion)
[x] Display uses correct unit from selection (cup, ml, etc)
[x] CaffeineLogPopup shows "2 cup" not "4.74 cup" ✓
[x] Quick Add section shows "2 cup" not "4.74 cup" ✓
[x] Edit modal shows quantity=2 with unit="cup" ✓
[x] Custom drinks still work with divisor=100 ✓

ALL INBUILT SOURCE FEATURES COMPLETE AND WORKING ✓
