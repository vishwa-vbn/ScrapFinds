# MARKETING_QR.md — Getting the app onto people's phones

## The honest mechanics
A QR code opens a **link**. A website cannot install itself silently: the visitor must tap one **Install** button (Android/Chrome) or use Share → Add to Home Screen (iPhone). So the whole strategy is: **QR → `/install` page → one obvious tap**. The QR must also work for people who never install — they just browse and call.

Every QR points to `https://<domain>/install?src=<channel>`; the `src` value tells you which channel brought the visit (stored for later analytics; no tracking in Phase 1).

| Channel | `src` | Where it goes |
|---|---|---|
| Poster | `poster` | Your collection point/shop wall, society notice boards, tea stalls, local shops (with permission) |
| Visiting card | `card` | Every household/customer you meet while collecting scrap |
| Vehicle sticker | `vehicle` | Cart / rickshaw / van, back and side panels |
| Flyer | `flyer` | Hand out in neighbourhoods on collection rounds |
| Item sticker | `sticker` | Stick on the items themselves ("more like this → scan") |
| WhatsApp | `whatsapp` | Link (not an image) in status, groups, broadcast |

## Printing rules (so scans never fail)
- Use the SVG from `marketing/qr/`. Black on white, never inverted, no gradients behind the code.
- Minimum size: 3 cm (card), 5 cm (sticker), 8 cm+ (poster/vehicle). Keep the blank border (4 modules).
- Print on matte stock where possible (glossy glare breaks scans). Don't put it on a curved or folded surface.
- Add the short URL in text under the QR (`yourdomain.com/install`) for people who can't scan.
- **Test every print with an Android and an iPhone before printing 500 copies.**

## Messages that work (adapt to your language)
- Poster headline: **"Good items, hand-to-hand. No money, just call."** Sub: *Speakers • Phones • Cycles • More. Scan to see what's available.* Footer: *We also buy scrap — call [number].*
- Visiting card back: **"Scan → install our app → see items available today."**
- WhatsApp status/broadcast: *"New items today: [item names]. See photos: https://yourdomain.com/items — tap Install to add the app to your phone. Call [number] to collect."*
- Vehicle: big phone number + QR + "Scrap bought / Good items available".

## Habits that grow installs
1. **Post weekly "new arrivals"** on WhatsApp with the direct item link (the item page has a Share button that pre-fills the message). Fresh stock is the reason people keep the app.
2. **Hand the card during every pickup**: "Scan this to see what we have; call anytime."
3. **Show the owner how to add the app on his own phone** and demo the item list to neighbours; word of mouth beats posters.
4. **Create a free Google Business Profile** (business name, phone, hours, website link, photos of the collection point). This is the best free way to be found by people searching "scrap dealer near me". Put the website link in it.
5. **Local groups:** apartment/RWA WhatsApp groups, community pages (follow each group's rules; ask admins first).
6. **Trust:** real photos, honest condition labels, "as-is, check before taking", one consistent phone number everywhere.
7. **Seasonal pushes:** festival cleaning, house shifting season, college semester starts (students want cycles, speakers, phones).

## What to measure (manually, free)
- Count new calls/WhatsApp chats per week and ask callers "where did you see us?" (poster / card / WhatsApp). Compare with which QR channels you printed.
- Firebase/Vercel dashboards give rough traffic; detailed per-`src` analytics is a Phase 2 add-on.

## Rollout plan (first 4 weeks)
| Week | Action |
|---|---|
| 1 | Upload 10–15 real items. Install on owner's and family phones. Test QR on 5 different phones. |
| 2 | Print 100 cards + 5 posters. Start handing cards on every round. WhatsApp status with link. |
| 3 | Vehicle sticker. Google Business Profile live. Post in 3–5 local groups. |
| 4 | Review which channel brought callers; reprint the best performers; add more items. |
