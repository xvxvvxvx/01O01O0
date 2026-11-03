# 01O0
Free-to-play simulator using fictional **01O0coin** currency.

## Notes
- Leaving a round mid-game forfeits the wager.
- Have fun please I worked hard on the game :3

## Update 2.3
Gem-Shop crates (TAGS / GRADIENTS), 5 new tags + 4 new gradients, Cases fake-common and rollback tip-over events (tease chance 80% -> 60%),
Aviamasters rebalance (RTP about 97%) and visual upgrade, global rebrand (01O0coin, Wager).

## Update 2.4
Quests replaced (daily: 500 rounds / 10,000 profit / 1 h; weekly: 4,000 rounds / 100,000 profit / 5 rank-ups / 5 h; playtime quests are fed by the shared playtime counter), playtime moved to the homepage, new header layout,
Gem-Shop cleanup (no rotation timer), crate-opening Skip button fixed in its own slot, cosmetic preview particles only on hover, rank layout fixes at 100% zoom,
`?h, ?m, ?s` daily quest timer, and a sidebar **about:blank** toggle.

## Update 2.45
- **Rank Expansion 2**: Rank-Up page 3; Extreme Demon -> Extreme Demon I; new ranks Extreme Demon II/III, Impossible Demon I-III, Unreal I-III, Division 5-1 (max). Icons `impossibledemon/unreal/div5..div1.jpg` are white placeholders: replace the files, keep the names.
- **Speeds** (animation only): Cases 1.5x Silver, 2x Amethyst, 2.5x Impossible Demon I; Aviamasters 1.5x Silver, 2x Amethyst, 2.5x Division 5, 2.75x Division 1 (shown beside the Launch button). Rank-Up reward lines are generated from `CFG`.
- **Calculator landing page** (`index.html`); the game moved to `game.html`. Typing `0 - 100` then `=` opens the game in an about:blank tab (calculator + game as two views). If pop-ups are blocked the tab navigates calculator <-> game instead. The sidebar about:blank button was removed.
- **Aviamasters** RTP ~96.8% -> ~98.3% (lower runway-slide chances; rocket/item odds unchanged).
- **Anti-macro**: `guard.js` now analyses every trusted click (including ones ignored during a Cases spin), catches fast/regular autoclickers, escalates the cool-down and keeps it across refreshes.

## Update 2.5
- **Renamed to Gold**: the logo, page title, welcome heading and home heading now read "Gold" in an animated gold gradient (`css/update25.css`). The calculator easter egg is still `0 - 100 =`.
- **Cases**: new red **X** outcome (0x payout) drawn as a small X on the tile. Rolled odds: X 31.5% / Common 20% / Uncommon 27% / Rare 13% / Legendary 5.2% / Mythic 2.6% / Secret 0.7%. The Case Odds list shows X 26% / Common 25% / Uncommon 27% / Rare 13% / Legendary 5% / Mythic 3% / Secret 1%. Multiplier ranges: Common .2-.8x / Uncommon 1-1.25x / Rare 1.3-2x / Legendary 2.4-3.4x / Mythic 3.8-5.4x / Secret 6-11x (~95% return, 48.5% of rounds in profit; the original game returned ~187%). Rare flips (presentation only): a real X can first appear as a Common/Uncommon/Rare tile (6%) and a non-X result can first appear as an X (4%); the tile flips over to the real result.
- **Aviamasters**: win rate raised to sit next to Cases (91% of flights land, ~44% finish in profit; rocket chance .3, items +.4/+.8/+2/+4 and x1.3/x1.6/x1.9, multiplier growth slows above 2x) while the return is ~99%. Landing below 1x is a loss: the multiplier and the history chip are red, no confetti.
- **Economy rebalance**: both games now return about 95-99%, so balances no longer compound. Rank-up money requirements re-curved from 2,500 - 7,000,000 down to 250 - 1,100,000 (round counts unchanged), daily profit quest 10,000 -> 2,500, weekly profit quest 100,000 -> 20,000.

## Latest changes
- **Right Shift** (tap it on its own) toggles between the calculator and the game instead of Backspace. Backspace is now always the calculator's delete key. The tip in the game header says so.
- **Calculator page**: light/dark mode switch (remembered in `localStorage`), a right-hand side bar with an interactive periodic table (`js/ptable.js`). Clicking the Gold (Au) element opens the game, the same way `0 - 100 =` does.
- **Removed** the cloud profile / cosmetics cloud-sync integration (its script, demo page and settings panel). Saves are local only.

## Tests
`node tests/update245.test.js`, `node tests/update23.test.js`, `node tests/economy.test.js`, `node tests/security.test.js`
