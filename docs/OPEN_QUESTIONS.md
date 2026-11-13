# Open questions and known inconsistencies

Check here before inventing anything. When you decide one, write the decision under it.

## Data consistency in the screen designs

1. **Key count differs between screens.** Home, Scan, Keys wallet and Profile show 7 keys; City League, the drop screens and Key landing show 8. The intended story: Maya starts at 7, returns the trench (8), buys the skirt (7). **Decision for the build:** read from the store, never hard-code.
2. **Maya's tier.** Most screens say Seam; the Profile screen subtitle says "Cut tier". Treat Seam as current (the promotion to Cut happens in the "End the week" demo).
3. **Garment names.** Some screens use real Zara product names ("Midi trench, ZW Collection", "ZW pleated midi skirt"); others use generic ones ("belted trench", "linen blazer" on the Home lot card). Use `seed.json` names everywhere.
4. **Profile "since" date.** Profile says Oct 2026; seed says Sep 2026. Low stakes; pick one.

## Product decisions not yet made

5. Do tier bonus keys (Cut +1/month, Archive +2/season) count toward the 10-a-month cap? Suggested: no, cap applies only to returns.
6. What happens to a pass if you're relegated before Tuesday? Suggested: a pass is honoured for the next drop.
7. Style Battle entry: the deck says Cut tier; the pass screen says a battle win can earn a pass. Both can be true; confirm.
8. Grade C (unwearable) pieces: they go to re-cut or fiber and earn the base key only. Confirm.
9. Points for city-goal participation? Currently none beyond the return itself.
10. Closet "Ask about fit": chat, or a structured question routed to fit notes? Suggested: structured question to keep moderation simple.
11. Pre-Owned selling from a closet uses Zara's existing Pre-Owned flow; Encore only shows it and awards +40. Confirm.

## Content gaps

12. **Team survey placeholders** in the deck: "n = [ ]", "[Y]%", "[Z]%". Need real results before submission.
13. **Real product photos.** The team wants real Zara product images. They could not be downloaded in the design environment. Keep `garment.image` swappable.
14. **Depop age stat.** A popular claim says "~90% of Depop users are under 26"; the verified source used (Retail Gazette, Jul 2026) says nearly 90% of active buyers are under 34. Use the verified figure.
15. City-goal numbers (61,240 of 100,000; city race shares) and all league names are illustrative.

## Legal and brand

16. This is a student concept. Don't use Zara's logo or wordmark as branding; keep the "not affiliated" notice.
17. Tree-planting milestone: stated as an action ("10,000 trees planted with the parks department"), never as an offset or "carbon neutral" claim (EU green-claims directive).
