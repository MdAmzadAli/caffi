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
[x] 14. FIXED custom drink entry editing - quantity and mg now persist correctly
    - Root cause: Code was looking up custom drink DEFINITION and using ITS stored caffeine value
    - Problem: If user edited qty=2, mg=15 (total=30) and saved, reopening looked up definition
    - Result: Would recalculate as qty=1.2, mg=25 (original definition values)
    - Solution: Removed custom drink lookup for ENTRY edits (not definition edits)
    - Now: For custom drink entries, uses entry's caffeineAmount directly as quantity=1, caffeineMg=total
    - This preserves the exact total amount user saved without recalculation
    - Example: Edit to qty=2, mg=15 (total=30) → saves caffeineAmount=30 → reopens as qty=1, caffeineMg=30
    - User can then modify quantity/mg again, and it recalculates totalCaffeine correctly
    - Key insight: Each logged entry stands alone - don't look up drink definition for past entries
    - Minimal fix: Removed 8 lines of custom drink lookup logic
    - Fully responsive: Uses existing styles and totalCaffeine calculation
