# Test Instructions

## Browser-Based Automated Tests

Run the automated test suite to verify game functionality:

1. Make sure your local server is running (e.g., `python -m http.server 8000`)
2. Open `test.html` in your browser: http://localhost:8000/test.html
3. The page will automatically run all tests and display results

## Tests Included

The automated test suite checks:

1. ✅ Phaser library import and version
2. ✅ All 5 scene modules (Boot, Title, Overworld, Explore, Battle)
3. ✅ Entity modules (Mimi, Enemy)
4. ✅ Config modules (GameState, AssetConfig)
5. ✅ Data modules (enemies, items, regions)
6. ✅ UI modules (HUD, DialogBox)
7. ✅ Math modules (QuestionBank, Distractors)
8. ✅ Phaser game initialization
9. ✅ Scene registration
10. ✅ Input system setup
11. ✅ Mimi movement logic

## Manual Testing

After automated tests pass, manually test:

- **Arrow keys**: ↑ ↓ ← →
- **WASD keys**: W S A D
- Both should move Mimi in all 4 directions

## Debugging

If tests fail, check:
- Browser console for detailed error messages
- All files are being served correctly
- No CORS issues (use a local server, not file://)
