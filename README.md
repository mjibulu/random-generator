# Secure Random Generator

Generate unbiased browser-random numbers, strings, passwords, dice rolls, coin flips, and shuffled lists.

[Features](#features) · [Usage](#usage) · [Run locally](#run-locally) · [Contributing](./.github/CONTRIBUTING.md) · [Licence](./LICENSE)

## Features

- Unbiased cryptographic integer generation with configurable ranges, decimals, ordering, and uniqueness
- Random strings from selected character groups or a custom alphabet
- Password generation with required character groups, ambiguous-character exclusion, and entropy feedback
- List picking without repeats or complete list shuffling with duplicate and case controls
- Common dice presets, custom dice up to one million sides, and multi-die rolls
- Single or repeated coin flips with bounded result quantities
- Clear result summaries plus copy and tool-named text downloads

## Screenshot

![Secure Random Generator screenshot](./public/tool-preview.webp)

## Usage

1. Choose Numbers, Strings, Passwords, List, Dice, or Coin mode.
2. Configure the range, alphabet, length, list rules, dice, or flip count shown for that mode.
3. For passwords, review the selected character groups and strength estimate before generating.
4. Generate the values and review the result count and mode-specific summary.
5. Copy or download the results, clear them, or generate a fresh set.

## Browser support

Works with current versions of Chrome/Chromium, Firefox, and Safari.

- Secure random generation requires the browser Web Crypto API.
- Downloads follow the browser's normal file-download settings and permissions.

## Run locally

You’ll need Git, Corepack, and Node.js 22.13.x or 24.x.

```bash
git clone https://github.com/mjibulu/random-generator.git
cd random-generator
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

Open the local URL shown in the terminal.

## Checks

```bash
pnpm run check
pnpm run verify
```

## Build

```bash
pnpm run build
```

The production files are created in `dist/` and can be hosted on GitHub Pages, Netlify, Cloudflare Pages, Vercel, or any static host.

## Privacy

The app runs in your browser and does not include analytics, ads, or telemetry.

This tool does not require persistent browser storage.

This tool uses: crypto.getRandomValues, Blob downloads. Availability may vary by browser.

## Contributing

Issues and pull requests are welcome. See the [contribution guide](./.github/CONTRIBUTING.md) before submitting changes.

## Credits

Created by Mujeeb for [eBURP](https://eburp.com/).

## Licence

Licensed under the [MIT Licence](./LICENSE). Third-party dependencies keep their respective licences.
