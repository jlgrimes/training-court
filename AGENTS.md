# Repository Agent Instructions

## General Translation

- This app uses `gt-react` for inline translations and stores generated locale files in `public/_gt`.
- Wrap new user-facing static text in `TranslatedText` from `components/general-translation/TranslatedText.tsx`, or use `T` / `useGT` directly in client components when translating attributes, placeholders, and toast text.
- Keep translation ids stable and descriptive. Prefer route or feature prefixes, such as `preferences.account.title` or `battleLogs.input.submit`.
- Keep translations hardcoded in `public/_gt`; do not add remote translation update steps.
- After adding or changing user-facing copy, update every locale file in `public/_gt`, then run `npm run translations:check`.
- The `Check Translations` GitHub Actions workflow runs on every branch push and verifies that all locale files are present and have aligned translation keys.
