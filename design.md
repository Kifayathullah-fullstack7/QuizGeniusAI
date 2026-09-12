# QuizGenius AI — Style Reference
> the quiz that tells you why your brain got it wrong

**Theme:** dark

QuizGenius AI operates as a deep-obsidian workspace where a single glassmorphic panel floats on near-black, punctuated by a violet-to-blue gradient that signals the product's one signature action. Typography is bold and compact — a confident sans-serif carries the hero headline at a large, heavy weight while every supporting label drops to small, muted, uppercase micro-copy, so the eye is pulled straight to the one line that matters: "why your brain got it wrong." The visual centerpiece isn't an illustration but a state — the violet-bordered "selected" preset card and the gradient CTA button are the only saturated surfaces on the page, everything else recedes into near-black and gray. Layout follows a single-column, centered rhythm: a compact header, a centered hero block, one large glass panel holding the entire ingestion flow, and a row of three feature cards beneath it. Components are reduced to essentials — pill badges, one bordered input, one slider, one gradient button — so the interface reads as focused tooling rather than a marketing page.

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Obsidian Void | `#08090E` | `--color-obsidian-void` | Page canvas — the dominant near-black surface behind every section |
| Glass Panel | `rgba(17, 19, 30, 0.75)` | `--color-glass-panel` | Main ingestion card and feature-card backgrounds, paired with `backdrop-filter: blur(16px)` |
| Hairline Border | `rgba(255, 255, 255, 0.08)` | `--color-hairline-border` | Default card and input borders — barely visible, just enough to separate surfaces |
| Bone White | `#FFFFFF` | `--color-bone-white` | Headline text, button labels, primary card titles |
| Ash Gray | `#9A9AA6` | `--color-ash-gray` | Body copy, descriptions, placeholder text |
| Silver Mist | `#6B6B76` | `--color-silver-mist` | Uppercase micro-labels, tick marks, least-emphasis text |
| Electric Violet | `#8B5CF6` | `--color-electric-violet` | Selected-state borders, primary label accents, gradient start, brand mark |
| Sky Blue | `#38BDF8` | `--color-sky-blue` | Gradient end (paired with violet) on the CTA button and headline highlight |
| Autopsy Pink | `#F472B6` | `--color-autopsy-pink` | The "wrong." headline word and the Cognitive Autopsy feature icon — reserved for the signature diagnostic moment |
| Ingestion Cyan | `#22D3EE` | `--color-ingestion-cyan` | "Zero-shot ingestion" label, the Distractor Forensics badge, the Groq LPU feature icon |
| Ready Green | `#4ADE80` | `--color-ready-green` | The "LPU Engine Ready" status dot — the only pure status/success color on the page |
| Fallback Amber | `#FBBF24` | `--color-fallback-amber` | Self-Healing Engine feature icon — warm accent reserved for the resilience feature |

## Tokens — Typography

**Primary typeface:** a geometric sans-serif (Inter or equivalent system sans). Headline weight is heavy (700–800) at large scale for the hero line; every other text element drops to regular (400) or medium (500) at small sizes. Uppercase micro-labels carry wide letter-spacing to read as system labels rather than prose.

- **Substitute:** Inter, system-ui
- **Weights:** 400 (body, descriptions), 500 (card titles, button label), 700–800 (hero headline)
- **Sizes:** 11px (badge text), 12px (uppercase micro-labels, tick marks), 13px (descriptions, placeholder), 14px (card titles, input text), 16px (button label), 34–40px (hero headline, three-line)
- **Line height:** 1.15 for the headline, 1.5 for body/description copy, 1.2 for labels
- **Letter spacing:** wide/uppercase tracking (~0.05em) on all micro-labels ("CHOOSE A PRESET...", "TOPIC / SKILL DOMAIN", "QUESTION COUNT"); normal tracking everywhere else

### Type Scale

| Role | Size | Weight | Color | Token |
|------|------|--------|-------|-------|
| micro-label | 12px | 500, uppercase | Silver Mist / Electric Violet | `--text-micro-label` |
| badge | 11px | 500 | context-dependent | `--text-badge` |
| body-description | 13px | 400 | Ash Gray | `--text-body-description` |
| input-text | 14px | 400–500 | Bone White | `--text-input` |
| card-title | 14px | 500 | Bone White | `--text-card-title` |
| button-label | 16px | 600 | Bone White | `--text-button-label` |
| subheadline | 14px | 400 | Ash Gray | `--text-subheadline` |
| headline | 34–40px | 700–800 | Bone White / gradient / Autopsy Pink | `--text-headline` |

## Tokens — Spacing & Shapes

**Base unit:** 4px

**Density:** compact-comfortable — generous panel padding, tight component-level spacing

### Spacing Scale

| Name | Value | Token |
|------|-------|-------|
| 4 | 4px | `--spacing-4` |
| 8 | 8px | `--spacing-8` |
| 12 | 12px | `--spacing-12` |
| 16 | 16px | `--spacing-16` |
| 24 | 24px | `--spacing-24` |
| 32 | 32px | `--spacing-32` |
| 48 | 48px | `--spacing-48` |
| 64 | 64px | `--spacing-64` |

### Border Radius

| Element | Value |
|---------|-------|
| main panel | 16px |
| preset cards | 12px |
| input / textarea | 10px |
| feature cards | 12px |
| CTA button | 12px |
| badges / pills | 9999px (full) |
| logo mark | 10px |

### Layout

- **Content max-width:** ~720px (single centered column)
- **Section gap:** 32–48px
- **Panel padding:** 24–32px
- **Element gap:** 8–16px

## Components

### Logo Lockup
**Role:** Brand mark + wordmark + edition badge in header

Small rounded-square icon (violet border, dark fill) containing a simplified brain/node glyph, paired with "QuizGenius AI" in bold white, followed by a small uppercase pill badge reading "COGNITIVE AUTOPSY EDITION" in muted violet-bordered outline style. The edition badge is the only place small-caps outline pills appear in the header.

### Status Pill
**Role:** Live system-status indicator, top-right of header

A small filled circle (Ready Green) paired with label text ("LPU Engine Ready") inside a dark pill with a hairline border. Communicates backend/AI readiness at a glance — this pattern should be reused for any future live-status indicator (e.g. "Fallback Active").

### Feature Claim Badge
**Role:** Single-line differentiator pill above the hero headline

Centered pill with hairline border, small icon, and cyan text ("The only quiz engine powered by Distractor Forensics"). Used sparingly — one per page, directly above the hero headline, to state the core differentiator before the headline expands on it.

### Hero Headline Block
**Role:** Three-line, center-aligned, color-coded headline

Line 1 in Bone White, line 2 rendered with a violet-to-blue gradient fill, line 3 ("wrong.") in solid Autopsy Pink. The color progression itself tells the story: neutral statement → the mechanism (gradient, "brain") → the emotional payoff (pink, "wrong"). Supporting body copy below in Ash Gray, centered, max two lines.

### Preset Topic Card
**Role:** Selectable quick-start topic tile, 2×2 grid

Dark card with hairline border, title in Bone White, a small gray domain badge top-right ("Frontend", "Backend", "Core JS", "Architecture"), and a one-line muted description below. Default state uses the hairline border; unselected cards are otherwise visually flat.

### Selected Preset Card (state)
**Role:** Active/chosen state of the Preset Topic Card

Same layout as the default card, but the border switches to Electric Violet and the card fill gains a faint violet tint. This is the only card-level state change in the interface — no hover shadows, no scale transforms, just a border and tint swap.

### Labeled Input Field
**Role:** Single-line text input with an uppercase micro-label above it

Micro-label in violet uppercase ("TOPIC / SKILL DOMAIN") sits directly above a full-width dark input with a hairline border, white input text, and a small violet diamond glyph anchored right as a decorative "active/AI-ready" marker.

### Ingestion Textarea
**Role:** Optional multi-line paste field for custom notes/syllabus

Micro-label with a small icon on the left ("PASTE CUSTOM NOTES OR DOCUMENTATION (OPTIONAL)") and a live character counter on the right ("0 chars"). The textarea itself uses placeholder copy that explains what the AI will do with the pasted content, rather than a generic "Enter text" prompt — placeholder text does product education here.

### Range Slider with Ticks
**Role:** Question-count selector, 3–10 range

Track is a thin gray bar; the filled portion (left of the thumb) uses the violet-to-blue gradient, thumb is a small filled circle. A pill badge above-right shows the live value ("5 Questions") in violet. Below the track, three tick labels mark named presets ("3 (Speed Blitz)", "5 (Standard)", "10 (Deep Mastery)") rather than plain numbers — turning a generic slider into a labeled difficulty/length choice.

### Primary Gradient CTA Button
**Role:** The single full-width action that launches the Challenge Arena

Full-width button, violet-to-blue gradient fill, white bold centered label with a trailing arrow glyph ("Enter Challenge Arena →"). This is the only gradient-filled surface of button size on the page — reserved exclusively for this one action.

### Feature Highlight Card
**Role:** Three-across row of differentiator summaries beneath the main panel

Small dark card, hairline border, a colored icon (pink for Cognitive Autopsies, cyan for Groq LPU, amber for Self-Healing Engine), bold white title, and a short muted description. Icon color is the only variation between the three cards — layout and typography are identical, keeping the row visually calm despite covering three different technical claims.

## Do's and Don'ts

### Do
- Reserve the violet-to-blue gradient exclusively for the primary CTA button and the hero's middle headline word — it should always mean "the main action" or "the mechanism," never decorate a secondary element
- Use Autopsy Pink only for the word "wrong" and the Cognitive Autopsy feature icon — it's the signature-feature color and loses meaning if spread across the UI
- Keep every card surface at the same glass fill and hairline border — the only card-level state change allowed is the violet border + tint on a selected preset
- Set all micro-labels in uppercase with wide tracking and a muted or violet color — this is what separates "system label" text from body copy at a glance
- Keep the CTA button full-width and singular per screen — one gradient button, no exceptions

### Don't
- Do not introduce a second gradient-filled button on the same screen — it dilutes the CTA's visual priority
- Do not use Ready Green anywhere except live-status indicators — it should never appear as a decorative accent
- Do not add drop shadows or glows to the preset cards beyond the violet border on selection — state changes are communicated by border and fill tint only, not elevation effects
- Do not set body/description text above Ash Gray in brightness — only headline and card titles get full Bone White, preserving the hierarchy between "read this first" and "supporting detail"
- Do not stack more than one uppercase micro-label directly above a single input without spacing — each labeled field needs consistent 8px breathing room between label and control

## Surfaces

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Obsidian Void | `#08090E` | Page background — the base near-black canvas |
| 1 | Glass Panel | `rgba(17, 19, 30, 0.75)` + blur(16px) | Main ingestion panel, feature cards, preset cards |
| 2 | Violet Selected | `#8B5CF6` border + tint fill | Selected preset card state only |
| 3 | Gradient Surface | `linear-gradient(90deg, #8B5CF6, #38BDF8)` | CTA button and headline gradient text — highest-priority surface on the page |

## Similar Brands

- **Linear** — same dark-void, single-accent-color discipline, and compact uppercase micro-labeling used to keep a dense interface legible without visual noise
- **Vercel** — matching near-black canvas with one saturated gradient reserved for the primary action, everything else rendered in grayscale
- **Anthropic** — dark-mode-first product surfaces with a restrained palette where color is assigned meaning (status, signature feature) rather than used decoratively

## Quick Start

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-obsidian-void: #08090E;
  --color-glass-panel: rgba(17, 19, 30, 0.75);
  --color-hairline-border: rgba(255, 255, 255, 0.08);
  --color-bone-white: #FFFFFF;
  --color-ash-gray: #9A9AA6;
  --color-silver-mist: #6B6B76;
  --color-electric-violet: #8B5CF6;
  --color-sky-blue: #38BDF8;
  --color-autopsy-pink: #F472B6;
  --color-ingestion-cyan: #22D3EE;
  --color-ready-green: #4ADE80;
  --color-fallback-amber: #FBBF24;

  /* Gradient */
  --gradient-primary: linear-gradient(90deg, #8B5CF6, #38BDF8);

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  --text-micro-label: 12px;
  --text-badge: 11px;
  --text-body-description: 13px;
  --text-input: 14px;
  --text-card-title: 14px;
  --text-button-label: 16px;
  --text-headline: 36px;

  --leading-headline: 1.15;
  --leading-body: 1.5;
  --tracking-micro-label: 0.05em;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;
  --spacing-64: 64px;

  /* Border Radius */
  --radius-panel: 16px;
  --radius-card: 12px;
  --radius-input: 10px;
  --radius-button: 12px;
  --radius-pill: 9999px;

  /* Backdrop */
  --blur-panel: 16px;
}
```

### Tailwind v4

```css
@theme {
  /* Colors */
  --color-obsidian-void: #08090E;
  --color-glass-panel: rgba(17, 19, 30, 0.75);
  --color-hairline-border: rgba(255, 255, 255, 0.08);
  --color-bone-white: #FFFFFF;
  --color-ash-gray: #9A9AA6;
  --color-silver-mist: #6B6B76;
  --color-electric-violet: #8B5CF6;
  --color-sky-blue: #38BDF8;
  --color-autopsy-pink: #F472B6;
  --color-ingestion-cyan: #22D3EE;
  --color-ready-green: #4ADE80;
  --color-fallback-amber: #FBBF24;

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  --text-micro-label: 12px;
  --text-badge: 11px;
  --text-body-description: 13px;
  --text-input: 14px;
  --text-card-title: 14px;
  --text-button-label: 16px;
  --text-headline: 36px;

  /* Spacing */
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-12: 12px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-48: 48px;
  --spacing-64: 64px;

  /* Border Radius */
  --radius-panel: 16px;
  --radius-card: 12px;
  --radius-input: 10px;
  --radius-button: 12px;
  --radius-pill: 9999px;
}
```

---
*Note: color values above are read visually from the current build's screenshot, not sampled with a color picker — spot-check them against your actual Tailwind config or CSS before treating this as the source of truth, and correct any token that drifts once you have exact hex values.*