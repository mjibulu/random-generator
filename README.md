# Secure Random Generator

Generate unbiased browser-random numbers, strings, passwords, dice rolls, coin flips, and shuffled lists.

## Features

- Unbiased cryptographic integer generation with configurable ranges, decimals, ordering, and uniqueness
- Random strings from selected character groups or a custom alphabet
- Password generation with required character groups, ambiguous-character exclusion, and entropy feedback
- List picking without repeats or complete list shuffling with duplicate and case controls
- Common dice presets, custom dice up to one million sides, and multi-die rolls
- Single or repeated coin flips with bounded result quantities
- Clear result summaries plus copy and tool-named text downloads

## Screenshot

![Secure Random Generator interface](./public/tool-preview.webp)

## How to use

1. Choose Numbers, Strings, Passwords, List, Dice, or Coin mode.
2. Configure the range, alphabet, length, list rules, dice, or flip count shown for that mode.
3. For passwords, review the selected character groups and strength estimate before generating.
4. Generate the values and review the result count and mode-specific summary.
5. Copy or download the results, clear them, or generate a fresh set.

## Browser support and limitations

The current stable releases of Chromium, Firefox, and Safari are supported.

- Secure random generation requires the browser Web Crypto API.
- Downloads follow the browser's normal file-download settings and permissions.

## Clone and run locally

Requirements:

- Git
- Node.js 22.13.x or Node.js 24.x (recommended)
- Corepack

```bash
git clone https://github.com/mjibulu/random-generator.git
cd random-generator
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

The development server prints the local URL to open in your browser.

## Verify

Fast checks:

```bash
pnpm run check
```

Complete browser verification:

```bash
pnpm run verify
```

## Build and host

```bash
pnpm run build
```

Upload the contents of `dist/` to a static host. The application supports both
root and subdirectory hosting and needs no environment variables.

The same output can be deployed with GitHub Pages, Netlify, Cloudflare Pages,
Vercel static hosting, or an ordinary file upload.

## Data and network behaviour

The application ships without analytics or telemetry. Tool processing occurs
in the browser, and the primary browser tests fail unexpected external
requests. See [PRIVACY.md](./PRIVACY.md) for the storage and browser API
inventory.

## Contributing

Issues and pull requests are welcome. Read
[CONTRIBUTING.md](./CONTRIBUTING.md) before submitting a change.

## Credits

Created by M. Jibulu for [eBURP](https://eburp.com/).

## Licence

Original code is available under the [MIT Licence](./LICENSE). Dependencies and
assets retain their own licences; see
[THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
