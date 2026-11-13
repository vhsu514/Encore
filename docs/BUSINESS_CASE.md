# Business case (context for the build)

Full deck: `deck/Encore_Zara_Round1_v3.pptx` (text in `deck/deck_text.md`). Case brief: *What would make giving a garment a second life more appealing than buying a new one?* Present in five slides: the behavior, what we learned from existing solutions, the idea, and how to test it.

## 1. The behavior

The moment: the closet clean-out, when an 18-25-year-old decides a Zara piece is done. Today it goes to Vinted (61.8M Zara items listed, ~100,000 a day), a bin that pays €0 (17,015 t came back in 2022 with "no economic benefit"), or stays in the closet (32% of clothes never worn, Oxfam 2026). Barriers to secondhand: hygiene 48%, condition 45%, fit 38%, limited styles 22% (YouGov, Oct 2026).

**The insight:** supply isn't the problem; status is. A new drop has a date, an edit, visible scarcity and status. Secondhand Zara has none.

## 2. What we learned

- **Depop:** 7M active buyers (nearly 90% under 34), 3M sellers, bought by eBay for ~$1.2bn (Jul 2026). Social-first feed, identity over transaction, micro-entrepreneurship, peer-to-peer trust; 75% of its Gen Z users buy secondhand to reduce consumption, 55% for one-of-a-kind pieces, 45% for trends.
- **Returns:** Germany's deposit return gets 98% back (€0.25, 135,000 return points). Trove: 31% of trade-in credits used the same day. H&M's vouchers are the counter-example (76% of tracked items destroyed, exported or warehoused).
- **Motivation:** tangible rewards cut intrinsic motivation (d = −0.36); status and feedback raise it (+0.33). Duolingo leagues: +17% learning time. Starbucks tiers: ~60% of US revenue. Spotify Wrapped: 500M shares. Beli: 120M pairwise rankings.
- **Drops:** Galliano Re{form} sold out on the Zara app in under 10 minutes (~€100M from 157 pieces). Limited-quantity messages beat limited-time ones. 0 of 3 standalone swipe-shopping apps survived, so build inside the Zara app.

Design rules taken: earned never bought · status never discounts · quantities never timers · inside the Zara app · community first, then rank.

## 3. The idea

Phase 1 Encore Bins (earn keys) → Phase 2 community (deck, looks, closets, battles, leagues, city goal) → Phase 3 Archive Drops (spend keys). Runs on rails Zara already owns: care-label codes and NaviLens, soft-tag RFID in every store, the Zara app, the returns counter, the Tuesday delivery, Cáritas Moda re-. Bin cost ~€3,000 each, ~€6.3M for 2,089 stores (team estimate).

## 4. The test

20-store, 16-week pilot (10 test, 10 control) in Madrid and London. Cost ~€400,000. Timeline: weeks 1-2 bins and flag on; 3-4 keys, closets, leagues live; week 5 first drop; week 9 mid-point; week 16 decision.

| Metric | Pilot bar |
|---|---|
| Keys used for a drop within 30 days | 40% |
| Incremental spend, key holders vs control (90 days) | +10% |
| Community stickiness (DAU/MAU of league and closet cohort; D30) | 20%; 10% |
| Bin throughput; share graded A or B | 150 a week; 60% |
| Drop sell-through in 14 days, no markdown | 70% |
| New-to-brand share of drop buyers | 20% |
| Virgin material displaced | reported per lot |
| Median days from first scan to first drop | under 14 |

Decision rule: scale to Spain, the UK and France if bins, key use, sell-through and incremental spend all hit their bars; two of four earns a second season; fewer folds bins into the Cáritas flow.

What the app should therefore instrument (if you add analytics): returns, keys earned/spent, time from first scan to first drop, deck completion, follows, looks posted, battle votes, league retention, drop sell-through.
