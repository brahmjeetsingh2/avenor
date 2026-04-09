# Semantic Audit Exceptions (7 Apr 2026)

Scope: repo-wide scan for legacy role/glow patterns after semantic migration.

## Status

All previously listed P1 styling exceptions have been fixed.

Fixed files:

- `client/src/components/shared/CompanyCard.jsx`
- `client/src/components/shared/ExperienceCard.jsx`
- `client/src/pages/shared/CompanyDetailPage.jsx`
- `client/src/pages/alumni/AlumniMentorshipInboxPage.jsx`
- `client/src/index.css` (legacy role/glow variable cleanup and utility remapping)

## Current Residual Matches

Only string copy matches remain (not styling tokens):

- `client/src/pages/auth/AuthPages.jsx:32` -> text contains "role-based access"
- `client/src/pages/student/StudentDashboard.jsx:373` -> text contains "role-specific prep"

These are content strings, not visual token violations.

## Verification Command

```bash
cd /Users/brahmjeetsingh/Downloads/avenor
grep -RInE "role-|btn-shadow-(cyan|gold|magenta|coral)|shadow-glow|rgba\(255,\s*99,\s*146" client/src --exclude-dir=node_modules --exclude-dir=dist --exclude='*.map'
```
