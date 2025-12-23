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
[x] 13. FIXED quantity and mg preservation for CUSTOM drinks (definition editing)
[x] 14. FIXED custom drink entry editing - preserve total amount
[x] 15. FIXED custom drink entry editing - preserve quantity and per-unit mg
    - Solution: Reverse-calculate from servingSize and caffeineAmount
    - Formula 1: quantity = servingSize / defaultServingMl
    - Formula 2: perUnitMg = caffeineAmount / quantity
    - Look up custom drink definition ONLY to get defaultServingMl
    - Example: Saved qty=2, mg=30 (total=60) → servingSize=200 (100*2)
    - On reopen: qty = 200/100 = 2, mg = 60/2 = 30 ✓
    - Fallback: If custom drink not found, use entry's total as mg with qty=1
    - Minimal code: 7 lines, reuses existing patterns
    - Fully responsive: uses existing styles and getUnitForDrink
