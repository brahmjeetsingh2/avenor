# Semantic Color Mapping Guide

This project uses a restrained semantic palette with a monochrome-first UI.

## Core Rules

- Keep most UI neutral (cards, sections, nav, typography, separators).
- Use semantic colors only for status, alerts, and compact indicators.
- Prefer soft semantic surfaces:
  - Background tint: ~10-15% (`--*-bg`)
  - Border tint: ~20-25% (`--*-border`)
  - Text/icon: solid semantic token (`--success`, `--warning`, `--danger`)
- Avoid semantic gradients and glow-heavy effects for large sections.

## Token Mapping

- Success (positive states):
  - Base: `--success` (`#22C55E`)
  - Surface: `--success-bg`, `--success-bg-hover`
  - Border: `--success-border`
- Warning (caution/awaiting action):
  - Base: `--warning` (`#F59E0B`)
  - Surface: `--warning-bg`, `--warning-bg-hover`
  - Border: `--warning-border`
- Danger (errors/destructive/negative outcomes):
  - Base: `--danger` (`#EF4444`)
  - Surface: `--danger-bg`, `--danger-bg-hover`
  - Border: `--danger-border`

## Migration Notes

Use these replacements when cleaning old role-tinted UI:

- `role-cyan*`, `role-gold*`, `role-magenta*` in non-status UI -> `accent` or neutral surface/border tokens.
- Old coral/pink role tints used as decoration -> neutral or `accent`.
- Keep `danger` only for:
  - Error messages
  - Failed/declined/cancelled statuses
  - Explicit destructive actions (delete, remove, sign out)
- Keep `success` only for:
  - Completed/accepted/successful states
- Keep `warning` only for:
  - Pending/needs-attention states

## Practical Patterns

- Status chip:
  - Pending: `warning-bg + warning-border + warning`
  - Accepted/Completed: `success-bg + success-border + success`
  - Declined/Cancelled: `danger-bg + danger-border + danger`
- Primary action button:
  - `accent` background with subtle shadow
- Secondary action button:
  - neutral border and neutral text
