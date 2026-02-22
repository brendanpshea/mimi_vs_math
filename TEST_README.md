# Test Instructions

## Node.js Unit Tests

Four test suites run directly in Node with no browser or server needed:

```
node test_data.mjs         # data integrity + source-text contracts
node test_connectivity.mjs # map BFS reachability for all 5 regions
node test_unlock.mjs       # boss-door unlock, 9 lives, stars, hard mode
node test_questions.mjs    # QuestionBank + Distractors contracts
```

### test_unlock.mjs

Uses the **live `regions.js` data** (imported directly, no hardcoded stubs)
so enemy-count assertions can never silently drift out of sync after spawns
are added or removed.

Covers five groups of logic:

| Group | Tests |
|-------|-------|
| Key format | `instanceKey` produces correct composite keys for all regions |
| Defeat round-trip | `defeatEnemy` / `isEnemyDefeated` read-back; cross-region isolation |
| Remaining count | Counter decrements correctly; regions are isolated |
| `justUnlocked` logic | Boss door fires only on the last enemy; idempotent after boss clear |
| **9 Lives** | `useLife()` decrements, restores HP, returns false when empty, floors at 0 |
| **Star ratings** | `setRegionStars` / `getRegionStars`; only-improves invariant; per-region isolation |
| **Star cutoffs** | Mirrors BattleScene formula: 0 wrong=3★, ≤25%=2★, else=1★ |
| **Hard mode** | `defeatBossHardMode` / `hasDefeatedBossHardMode`; idempotent; per-region isolation |
| **reset()** | Clears lives, stars, and hard-mode state |

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
