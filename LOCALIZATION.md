# Language support

The application uses `src/localization.js` and `src/locales/` for display translation. Stored activity text and financial values are never rewritten when switching languages.

## Adding a language

1. Read the repository and locale DOX documents.
2. Create `src/locales/<code>.json`, following the structure of `en.json`. Set its native `languageName` and `locale` (for example `es-ES`).
3. Translate structured messages and categories. Add `ui` overrides keyed by the stable IDs in `ui.json` for migrated menus, controls, and messages.
4. Add a `data` object mapping original French business phrases to their translations. Unknown wording is preserved. A specific activity can also provide `translations.category` and `translations.description`, each containing language-code keys.
5. Run `npm test` and `npm run build`, and review the new language in the UI and print preview. Missing keys inherit English; adding a file does not produce translations automatically.

## Finance and PDF

Activity categories, descriptions, truck/contract labels, and additional expense labels use the same translation functions in the UI and financial report. Company names and routes are preserved.

The Finance report's PDF button opens the translated print document. Select **Save as PDF** in the browser's print dialog. The previous implementation downloaded HTML with a `.html` filename; the report PDF action now uses the browser's PDF renderer.

## Verification scope

The locale migration extracted 514 bilingual expressions and translated fixed UI text across the main views. The visible Dashboard, Analytics, Reports, Investors, Users, Audit, Categories, Forecast, Fleet Projection, Settings, and Withdrawal views were inspected using a local demo profile. Tests cover the actual financial report generator in both languages and preserve source data.

Unknown free-form text, names, addresses, legal identities, and historic entries outside the business glossary retain their original text. This is a glossary/catalog system, not a machine translation service. Future locales require supplied translations and visual review, including populated forms and exports.
