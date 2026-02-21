# Test Instructions

## Node.js Unit Tests

Four test suites run directly in Node with no browser or server needed:

```
node test_data.mjs        # data integrity + source-text contracts  (new)
node test_connectivity.mjs # map BFS reachability for all 5 regions
node test_unlock.mjs       # boss-door unlock / enemy-defeat logic
node test_questions.mjs    # QuestionBank + Distractors contracts
```

### test_data.mjs  *(new — catches refactor bugs before playtesting)*

Validates the static shape and cross-references of all data files, plus
scans source text for a class of bugs that the other tests can't catch:

| Section | What it catches |
|---|---|
| 1. Region schema | Missing / mistyped fields in `regions.js` |
| 2. Enemy cross-refs | Spawn or boss IDs that don't exist in `enemies.js` |
| 3. Map coverage | Missing `MAPS` / `WALK_GRIDS` entries |
| 4. No duplicate positions | Two key positions sharing the same tile |
| 5. Source-text contracts | **Constructor parameter renames that leave stale bare variable references** (direct cause of the "black screen" regression); HUD call-site argument type; `chestTile` removed from MST; `"Enemies: N"` comments matching real spawn counts |

Section 5 is what would have caught the `regionName → regionData` bug that
caused the black screen — it scans the HUD constructor body and fails if any
bare `regionName` (not `this.regionName`) appears after the parameter was renamed.

### test_unlock.mjs

Uses the **live `regions.js` data** (imported directly, no hardcoded stubs)
so enemy-count assertions can never silently drift out of sync after spawns
are added or removed.

### test_connectivity.mjs

BFS reachability from `mimiStart` to every enemy spawn, NPC, and boss tile.
`chestTile` is intentionally excluded — it was removed from the procedural
MST so the SE corner no longer gets a carved glade.

---

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
