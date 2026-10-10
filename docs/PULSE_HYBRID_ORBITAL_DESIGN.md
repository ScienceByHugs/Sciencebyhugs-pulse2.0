# Pulse 2.0 — Hybrid Orbital visual system (approved direction)

**Product mood:** Private orbital lab; human-designed, atmospheric and useful, not generic AI dashboard chrome.
**Stage:** Implementation proposal / reference. This document does not claim any screen has been converted.

## Palette and surfaces
- Background base: near-black midnight navy `#050A10`; subtle depth wash toward blue-gray `#0B1622`.
- Active highlight: existing cyan `#62CCFF`; use for interactive/selected/due states, not every label and border.
- Data text: white `#F7FAFC`; secondary slate `#8497A8`; warning amber `#F4BE73`, completed green `#63D6A3`.
- Keep real controls on **opaque surfaces** for contrast; space treatments live behind foreground content, not beneath microcopy.

## Background recipe
1. Place 8–18 tiny, fixed-position star points at very low contrast across an entire screen. No moving particle systems, random layout on every render, or effects covering form inputs.
2. Permit one quiet partial orbital arc near a hero or major section; **never on every card**.
3. Introduce depth with a subtle dark-blue tonal transition or calm curved horizon.
4. Avoid dramatic nebulae, overlaid photo watermarks, generic "AI network" patterns, repeated neon outer glows, and flickering animation.
5. Performance and accessibility: respect Reduce Motion, low-end device frame rates; decorative layers non-interactive and hidden from accessibility tree.

## Typography and composition
- Sentence-case functional labels; reserve uppercase micro-labels for occasional section markers.
- One strong page heading; information/action hierarchy before decoration.
- Numeric quantities remain tabular; units immediately attached and legible.
- Reduce repeated subtitle slogans and small badge count; use whitespace intentionally.
- Primary CTA visible as early as possible, at least 44 pt touch target.

## Component variants
- **Action card:** Opaque, intentional edge, strong single CTA. For Today due action.
- **Instrument panel:** Subtle border / track / mapped relationship, not uniform repeated rounded rectangles.
- **Quiet list row:** Low emphasis, high text readability; for Timeline and secondary account/settings items.
- **Exceptional status:** Amber warning only for low supply, green for completed, cyan active for due; include readable words not color alone.

## Screen rollout
- **Today**: first pilot. Compact hero, one restrained orbital arc in open space, next action above fold, fewer repeated daily summaries; keep successful logging prominent.
- **Protocol**: schedule map emphasized; reduce dense controls on substance cards, preserve archive/refill discoverability.
- **Timeline**: preserve connected history rail, reduce duplicate activity density charts.
- **Insights**: prioritize denominator breakdown and accessible weekday/stock labels.
- **Calendar**: display last successful sync and event range; refresh remains **manual**.
- **Tools**: calculator result as hero, descriptive unit-specific labels; no clinical recommendations.
- **You**: calmer lock/privacy controls with legible state captions, readable email, safe deletion.

## Release process
- Build Today pilot first and review on iPhone before app-wide conversion.
- Contrast, VoiceOver, Dynamic Type, Reduce Motion and safe-area checks mandatory.
- No full-screen background image or particle dependency required.
- No blanket rewrite of all cards; iterate by user task and physical screenshot.
