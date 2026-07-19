# Behavior sweep — Saint Germain header adapted for Triomax

## Source observations

- Desktop header is fixed and initially 148.8px tall.
- On scroll it receives a `compress` state and moves upward by 36–39px, hiding the secondary bar.
- Desktop layout: 39px topbar, about 60px logo row, 50px navigation.
- Search is icon-only. Clicking it opens a white 80px search band above a dark full-page backdrop.
- Navigation links have 400ms transitions and use restrained opacity feedback.
- At 768px the three-band desktop structure remains, with horizontally clipped/scrollable navigation.
- At 390px only a 56px sticky row remains; the announcement bar follows below it.
- External promotional overlays and the cookie banner belong to the source site and are intentionally excluded.

## Triomax implementation model

- Search: click-driven dialog; close button, backdrop click and Escape dismiss it.
- Mobile menu: click-driven drawer; Escape and link selection dismiss it.
- Scroll: native sticky header with `top: -39px` at desktop/tablet.
- Announcement: time-driven continuous marquee; hover pauses; reduced motion shows a static first group.
- Hover: nav and secondary links fade to 55–60% opacity.
- Focus: visible black outline on all interactive elements.
