[x] 1. Install the required packages
[x] 2. Restart the workflow to see if the project is working
[x] 3. Verify the project is working using the feedback tool
[x] 4. Inform user the import is completed and they can start building
[x] 5. Fixed image display in CustomDrinkModal edit interface
[x] 6. Fixed image persistence in My Consumption logs for custom images
[x] 7. Fixed preset image resolution in My Consumption logs
[x] 8. Fixed inbuilt source image persistence
[x] 9. Upgraded Node.js from v20.19.3 to v22.17.0
[x] 10. Fixed unit selector in CustomDrinkModal edit interface for inbuilt vs custom sources
[x] 11. FIXED ml/mg calculation for inbuilt sources in edit modal
[x] 12. FIXED quantity preservation and per-unit mg display for INBUILT drinks
[x] 13. FIXED quantity and mg preservation for CUSTOM drinks
    - Added customDrinks to useCaffeineStore destructuring
    - For custom drink edits: lookup drink from customDrinks array by name
    - Calculate: perServingMg = (caffeinePer100ml * defaultServingMl) / 100
    - Calculate: quantity = caffeineAmount / perServingMg (rounded to 1 decimal)
    - Set caffeineMg = perServingMg (the user's custom per-unit value)
    - Result: When editing, quantity and mg both restore to last chosen values
    - Example: Edited to qty=2, mg=13 → saves as 26 total → reopens showing qty=2, mg=13
    - Minimal code: 8 lines added, reuses existing patterns
    - Fully responsive: uses existing styles and getUnitForDrink function
