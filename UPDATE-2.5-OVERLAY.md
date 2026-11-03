# Update 2.5 overlay (everything in one)

Unzip over the project (same paths). Nothing else changes.

| File | Change |
|---|---|
| `game.html` | title + logo "Gold", loads `css/update25.css`, version label "Update 2.5" |
| `css/update25.css` (new) | animated gold gradient for the name, small X tile |
| `js/main.js` | welcome heading "Welcome to Gold" |
| `js/ui.js` | home heading "Gold Mini-games" |
| `js/config.js` | rank-up money curve, quest profit targets |
| `js/games/cases.js` | X outcome, new odds, new multiplier ranges, X flips |
| `js/games/aviamasters.js` | higher win rate, <1x landings red, ~99% return |
| `tests/update23.test.js`, `tests/economy.test.js` | updated expectations |
| `tests/update25.test.js` (new) | rank curve + Cases return checks |
| `README.md` | Update 2.5 notes |

## Cases
| Outcome | Rolled | Shown | Multiplier |
|---|---|---|---|
| X | 31.5% | 26% | 0x |
| Common | 20% | 25% | .2-.8x |
| Uncommon | 27% | 27% | 1-1.25x |
| Rare | 13% | 13% | 1.3-2x |
| Legendary | 5.2% | 5% | 2.4-3.4x |
| Mythic | 2.6% | 3% | 3.8-5.4x |
| Secret | 0.7% | 1% | 6-11x |

Return ~95%, 48.5% of rounds in profit. Original game: ~187% return. Flip events (visual only): real X shown as Common/Uncommon/Rare first 6%; non-X shown as X first 4%. The X glyph is now 22px inside the 72px icon box.

## Aviamasters (800k-flight Monte Carlo, run on the real game code)
Return ~99%, 91% of flights land, ~44% finish above 1x (was ~35% originally; Cases is 48.5%). Rocket chance .3; items +.4/+.8/+2/+4 and x1.3/x1.6/x1.9; the multiplier grows at 20% speed above 2x (HUD and payout agree). Landing below 1x is red and counts as a loss.
Why not higher: profit rate and return are tightly linked in this game; ~44% profit is about the most that fits a ~99% return.

## Economy
Returns above 100% compound when you bet a fraction of your balance, which is why balances and rank requirements ballooned. Now balances drift down slowly; rank money (positive round profits) is earned by grinding and Reset Balance refills your rank's starting cash.

Rank-up money (rounds unchanged): Unranked 250, Copper 800, Bronze 2,500, Silver 5,000, Iron 9,000, Ruby 14,000, Emerald 20,000, Amethyst 30,000, Diamond 50,000, Ascended 70,000, Verifier I-III 80k/90k/100k, Champion I-III 130k/145k/170k, Radiant I-III 190k/210k/240k, Insane Demon I-II 280k/300k, Extreme Demon I-III 330k/350k/390k, Impossible Demon I-III 420k/450k/490k, Unreal I-III 540k/600k/680k, Division 5-2 760k/850k/950k/1.1M (old top: 7,000,000).
Quests: daily profit 10,000 -> 2,500, weekly profit 100,000 -> 20,000.

## Tests
`tests/update25.test.js` passes (5/5). The 9 failures in the older suites (stale crate/catalog/rank-list/spin-speed expectations) existed before this update.
