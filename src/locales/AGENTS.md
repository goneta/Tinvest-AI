# Purpose

- Own the language catalogs used by Tinvest-AI UI and report renderers.

# Ownership

- `fr.json` and `en.json` contain structured messages, categories, locale metadata, and language names.
- `ui.json` contains stable IDs for migrated UI messages with French and English values.
- `../localization.js` owns catalog discovery, fallback, and business terminology; the repository root owns its code contract.

# Local Contracts

- Preserve message IDs and interpolation syntax. Never use translated labels as stored IDs or financial values.
- Add a locale as `<language-code>.json` with `languageName`, `locale`, and translated structured messages. The language selectors discover files automatically.
- A new locale overrides migrated messages in `ui` using the IDs in `ui.json`, and business phrases in `data` using the original French phrase as the key.
- Missing UI translations inherit English. Unknown user descriptions keep their original text; explicit per-field translations may be stored in `activity.translations.category` and `activity.translations.description`.
- Keep names, routes, addresses, amounts, and legal identities intact.

# Work Guidance

- Read the root DOX and this document before editing catalogs. Add both French and English values for new UI messages.

# Verification

- `npm test` validates locale structure parity, UI values, financial report language, and future-locale fallback.
- `npm run build` verifies Vite catalog discovery.

# Child DOX Index

- No child DOX documents.
