# HeroSection specification

## Overview

- Target: `src/components/HeroSection.tsx`
- Asset: `public/videos/hero-filaments.mp4`
- Interaction model: time-driven video with click-driven sound control

## Structure

- Full-bleed section directly after the header.
- Video fills the section with `width/height: 100%`, `object-fit: cover`, centered object position.
- Soft edge gradients improve contrast without obscuring the bright product video.
- A small lower-left content block and CTA provide context while preserving the central product.
- Sound control sits in the lower-right corner.

## Desktop

- Minimum hero height: `calc(100svh - 194px)`, never below 540 px.
- Content max-width: 1300 px with responsive horizontal padding.
- Eyebrow and CTA use the extracted cyan accent.

## Mobile

- Minimum hero height: `calc(100svh - 151px)`, never below 560 px.
- Video remains centered to preserve the central metallic form.
- Headline scales down and content anchors 24 px from the lower edge.
- CTA and sound control remain usable with at least 44 px hit areas.

## Video behavior

- `autoPlay`, `muted`, `loop`, `playsInline`, `preload="auto"`.
- The source file is copied without transcoding to preserve original quality.
- Sound begins muted to satisfy browser autoplay policies and may be toggled by the user.
