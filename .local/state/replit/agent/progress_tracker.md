[x] FINAL FIX: Inbuilt drinks now display exact quantity (2 cup not 4.74 cup)

## ROOT CAUSE:
For inbuilt drinks like "instant coffee", servingSize was stored as:
  servingSize = defaultServingMl * quantity
  Example: 237ml (cup) * 2 = 474ml

When displaying via getServingLabel:
  quantity = servingSize / 100 = 474 / 100 = 4.74 ❌
  Displays "4.74 cup" instead of "2 cup"

## FIX APPLIED:
Changed inbuilt drink servingSize storage to match custom drinks:
  Before: servingSize = prefillDrink.defaultServingMl * quantity (237 * 2 = 474)
  After:  servingSize = 100 * quantity (100 * 2 = 200)

### Line 327 - Create/Add:
```javascript
addEntry(prefillDrink as any, 100 * quantity, ...)  // was: defaultServingMl * quantity
```

### Line 312-313 - Edit:
```javascript
if (editEntry.category === "custom" || INBUILT_CATEGORIES.includes(editEntry.category)) {
  updates.servingSize = 100 * quantity;  // now includes inbuilt sources
}
```

## DATA FLOW NOW:
User adds 2 cups of instant coffee:
→ addEntry saves servingSize = 100 * 2 = 200
→ getServingLabel(200, "cup") calculates quantity = 200/100 = 2 ✓
→ Displays "2 cup" everywhere ✓

## COVERAGE:
[x] CaffeineLogPopup: Shows "2 cup" (not "4.74 cup") ✓
[x] Quick Add section: Shows "2 cup" ✓
[x] Edit modal: Preserves quantity correctly ✓
[x] Custom drinks: Still work as before ✓

ALL INBUILT AND CUSTOM DRINKS NOW DISPLAY WITH EXACT QUANTITIES ✓
