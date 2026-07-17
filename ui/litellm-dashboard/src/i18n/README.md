# Dashboard internationalization

The dashboard uses `i18next` and `react-i18next`. The supported locale contract is exactly `en` and `zh-CN`; `config.ts` owns normalization, the locale cookie, and the deployment default. `I18nProvider.tsx` restores the cookie and updates the document language.

## Resource contract

- Add keys to `resources/en.ts` first and then add matching values to `resources/zh-CN.ts`. The `TranslationShape` constraint makes a resource-shape mismatch a TypeScript failure.
- Use semantic namespaces (`common`, shared shell, or the closest feature namespace), not English sentences as keys. Shared overlays must not duplicate route-specific keys.
- Use i18next interpolation (`{{name}}`) for values and `_one`/`_other` keys for count-dependent copy. Do not concatenate translated fragments into sentences.
- Use `formatDate`, `formatNumber`, and `formatCurrency` from `format.ts` for user-visible values. Do not rely on the host machine locale.
- The default locale is `zh-CN`. Set `NEXT_PUBLIC_DEFAULT_LOCALE=en` at build time for an English-default deployment.

## Translation boundary

Translate surrounding explanatory copy, but preserve server-supplied content and these reviewed technical categories: LiteLLM and provider/product names; model identifiers; API/JSON field names; environment variables; URLs; code/CLI snippets; HTTP, SSO, OAuth, JWT, MCP, API, TPM and RPM; cloud region identifiers; and user-generated names. Add a category here before expanding the scanner allowlist.

## Verification

- Run `npm run i18n:scan` to reject new visible English literals relative to the reviewed baseline. Removed findings are allowed; new findings require translation or an explicit reviewed allowlist decision.
- Run focused tests in both locales. A route is not complete until its loading, empty, error, validation, notification, tooltip, accessibility and owned overlay paths have been checked.
- Refresh after switching locale to verify cookie persistence and the document `lang` value.
