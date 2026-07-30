# Secure Random Generator

Generate unbiased browser-random numbers, strings, passwords, dice rolls, coin flips, and shuffled lists.

## Features

- Unbiased integer generation with rejection sampling
- Configurable strings and passwords
- Number, dice, coin, and list-shuffle modes
- Ambiguous-character exclusion and strength feedback
- Bounded batches with copy and download

## Screenshot

![Secure Random Generator interface](./public/tool-preview.webp)

## Browser support and limitations

The current stable releases of Chromium, Firefox, and Safari are supported.

- Secure random generation requires the browser Web Crypto API.
- Downloads follow the browser's normal file-download settings and permissions.

## Run locally

Requirements:

- Node.js 24.x
- Corepack

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run dev
```

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
