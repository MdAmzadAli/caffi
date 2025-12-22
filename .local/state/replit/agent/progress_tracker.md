[x] 1. Install the required packages
[x] 2. Restart the workflow to see if the project is working
[x] 3. Verify the project is working using the feedback tool
[x] 4. Inform user the import is completed and they can start building
[x] 5. Fixed image display in CustomDrinkModal edit interface
[x] 6. Fixed image persistence in My Consumption logs for custom images
[x] 7. Fixed preset image resolution in My Consumption logs
[x] 8. Fixed inbuilt source image persistence - FINAL ROOT CAUSE FOUND AND FIXED
   - Root cause: HomeScreen.tsx (lines 96-107) getDrinkImageSource function had incorrect logic
   - Bug: Line 98 checked "if (item.category === 'custom' && imageUri)" - only checking custom drinks
   - Result: For inbuilt sources (coffee, tea, energy, soda, chocolate), it ALWAYS returned default CATEGORY_IMAGE
   - This ignored ANY saved imageUri for inbuilt sources, which is why edited images didn't show
   - Solution: Removed the "item.category === 'custom' &&" condition
   - Now checks "if (imageUri)" for ALL entries, whether custom or inbuilt
   - This properly uses saved imageUri for BOTH custom AND inbuilt sources
   - Key insight: Entries are rendered from HomeScreen.tsx (lines 377-418), NOT ConsumptionList.tsx
[x] 9. Upgraded Node.js from v20.19.3 to v22.17.0 to meet package requirements (>= 20.19.4)
[x] 10. Import completed and application running successfully
[x] 11. Fixed unit selector in CustomDrinkModal edit interface for inbuilt vs custom sources
   - Added INBUILT_CATEGORIES constant: coffee, tea, energy, soda, chocolate
   - Added isEditingInbuiltSource flag to detect when editing inbuilt source entries
   - Conditional rendering: shows radio buttons for inbuilt sources (like add modal), dropdown for custom drinks
   - For inbuilt source edits: displays standard unit + ml options as radio buttons
   - For custom drink edits: keeps current dropdown interface with multiple unit options
   - Reused existing styles (prefillUnitSection, radioRow, radioCircle) for consistency and responsiveness
