[x] COMPLETED: Custom drink unit selection properly persists and recovers

[x] Root cause analysis: Unit wasn't stored in DrinkEntry database field
[x] Solution implemented:
    - Added `unit?: string;` field to DrinkEntry interface
    - Save selectedUnit when creating entries (both inbuilt and custom drinks)
    - Save selectedUnit when editing entries (with unit parameter in addEntry)
    - Load unit from entry.unit when reopening edit modal (with fallback to getUnitForDrink)
    - Works for both inbuilt sources (coffee, tea, etc) and custom drinks
[x] Implementation details:
    - 1 field added to DrinkEntry interface
    - addEntry function now accepts optional unit parameter
    - All handleAdd code paths save selectedUnit
    - All useEffect recovery paths load unit from entry.unit
    - Minimal code: 3 key lines added to saving logic, 3 lines to loading logic
[x] Data flow:
    - User selects "tablespoon" and saves
    - Saved to DB: unit="tablespoon" (in DrinkEntry)
    - On reopen: setSelectedUnit(editEntry.unit || fallback)
    - Shows "tablespoon" ✓
[x] Fully responsive: Uses existing patterns and getUnitForDrink fallback

ALL FEATURES COMPLETE AND WORKING
