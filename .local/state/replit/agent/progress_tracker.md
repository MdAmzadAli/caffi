[x] COMPLETE: Inbuilt caffeine sources with "default" unit now show correct radio options on edit

## ROOT CAUSE:
For inbuilt sources that have "default" as their unit in the sizes array:
- When editing, the radio buttons showed "cup" and "ml" instead of "default" and "ml"
- This was because getUnitForDrink() always returns "cup" for coffee/tea/chocolate categories

## THE FIX:
Updated isEditingInbuiltSource section (lines 494-537):
1. Look up the drink from DRINK_DATABASE by name and category
2. Get unit from: drink.sizes[0].name (if exists) OR getUnitForDrink() fallback
3. Display that unit in the radio button text
4. Use it when selectedUnit is updated

## CODE PATTERN:
```javascript
{(() => {
  const drink = DRINK_DATABASE.find(d => d.name.toLowerCase() === editEntry.name.toLowerCase() && d.category === editEntry.category);
  const drinkUnit = drink?.sizes?.[0]?.name || getUnitForDrink(editEntry.name, editEntry.category);
  return (
    <Pressable onPress={() => setSelectedUnit(drinkUnit)}>
      ...
      <ThemedText>{drinkUnit}</ThemedText>
      ...
    </Pressable>
  );
})()}
```

## DATA FLOW:
User edits entry from "Instant Coffee" (which has sizes: [{name: "default", ml: 237}]):
→ isEditingInbuiltSource = true
→ Look up drink from DRINK_DATABASE
→ drink.sizes[0].name = "default"
→ Show radio option: "default" ✓
→ Show radio option: "ml" ✓
→ NOT "cup" ✓

## COVERAGE:
[x] Inbuilt sources with "default" unit show "default" radio option ✓
[x] "ml" option still shown ✓
[x] Fallback to getUnitForDrink() for sources without sizes ✓
[x] No changes to other flows ✓

COMPLETE AND FOCUSED ✓
